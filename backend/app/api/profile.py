from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os
from app.database.database import get_db
from app.models.models import Student
from app.models.schemas import APIResponse
from app.services.supabase_service import supabase_service

router = APIRouter()

@router.get("/profile")
async def get_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user profile by ID
    """
    try:
        # Try to get from Supabase first
        profile = await supabase_service.get_user_profile(user_id)
        
        if profile:
            return APIResponse(
                success=True,
                data=profile,
                message="Profile retrieved successfully"
            )
        
        # Fallback to local database
        student = db.query(Student).filter(Student.id == user_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return APIResponse(
            success=True,
            data={
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "grade": student.grade,
                "role": "student",
                "bio": None,
                "avatar_url": None
            },
            message="Profile retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile")
async def create_profile(
    user_id: str,
    name: str,
    email: str,
    role: str = "student",
    grade: Optional[str] = None,
    bio: Optional[str] = None,
    avatar_url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Create user profile
    """
    try:
        # Create in Supabase
        result = await supabase_service.create_user_profile(
            user_id=user_id,
            name=name,
            email=email,
            role=role,
            grade=grade
        )
        
        if not result["success"]:
            # Fallback to local database
            student = Student(
                id=user_id,
                name=name,
                email=email,
                grade=grade or "1"
            )
            db.add(student)
            db.commit()
        
        return APIResponse(
            success=True,
            data={"message": "Profile created successfully"},
            message="Profile created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile")
async def update_profile(
    user_id: str,
    name: Optional[str] = None,
    grade: Optional[str] = None,
    bio: Optional[str] = None,
    avatar_url: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Update user profile
    """
    try:
        updates = {}
        if name is not None:
            updates["name"] = name
        if grade is not None:
            updates["grade"] = grade
        if bio is not None:
            updates["bio"] = bio
        if avatar_url is not None:
            updates["avatar_url"] = avatar_url
        if role is not None:
            updates["role"] = role
        
        # Update in Supabase
        result = await supabase_service.update_user_profile(user_id, updates)
        
        if not result["success"]:
            # Fallback to local database
            student = db.query(Student).filter(Student.id == user_id).first()
            if student:
                if name is not None:
                    student.name = name
                if grade is not None:
                    student.grade = grade
                db.commit()
        
        return APIResponse(
            success=True,
            data={"message": "Profile updated successfully"},
            message="Profile updated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/avatar")
async def upload_avatar(
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload profile avatar
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"{user_id}_avatar.{file_ext}"
        
        # Save file locally (in production, use cloud storage)
        upload_dir = "uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Generate public URL (in production, this would be a cloud storage URL)
        avatar_url = f"http://localhost:8000/{file_path}"
        
        # Update profile with avatar URL
        await update_profile(user_id, avatar_url=avatar_url, db=db)
        
        return APIResponse(
            success=True,
            data={"avatar_url": avatar_url},
            message="Avatar uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
