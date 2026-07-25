import os
import httpx
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    
    async def create_user_profile(self, user_id: str, name: str, email: str, role: str = "student", grade: str = None) -> Dict[str, Any]:
        """Create user profile in Supabase"""
        data = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "grade": grade
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/profiles",
                headers=self.headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": response.text}
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/profiles?id=eq.{user_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                profiles = response.json()
                return profiles[0] if profiles else None
            return None
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/profiles?id=eq.{user_id}",
                headers=self.headers,
                json=updates
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            else:
                return {"success": False, "error": response.text}
    
    async def create_quiz_session(self, student_id: str, subject: str, topic: str, current_level: int = 1) -> Dict[str, Any]:
        """Create new quiz session"""
        data = {
            "student_id": student_id,
            "subject": subject,
            "topic": topic,
            "current_level": current_level,
            "status": "active"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/quiz_sessions",
                headers=self.headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": response.text}
    
    async def update_quiz_session(self, session_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update quiz session"""
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/quiz_sessions?id=eq.{session_id}",
                headers=self.headers,
                json=updates
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            else:
                return {"success": False, "error": response.text}
    
    async def get_user_quiz_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's quiz sessions"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/quiz_sessions?student_id=eq.{user_id}&order=start_time.desc&limit={limit}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            return []
    
    async def create_student_answer(self, session_id: str, question_id: str, selected_answer: str, 
                                   is_correct: bool, response_time: float, difficulty_level: str, 
                                   question_type: str) -> Dict[str, Any]:
        """Create student answer record"""
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "selected_answer": selected_answer,
            "is_correct": is_correct,
            "response_time": response_time,
            "difficulty_level": difficulty_level,
            "question_type": question_type
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/student_answers",
                headers=self.headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": response.text}
    
    async def get_user_dashboard_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user dashboard statistics"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/user_dashboard_stats?user_id=eq.{user_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                return stats[0] if stats else {}
            return {}
    
    async def create_achievement(self, user_id: str, achievement_type: str, achievement_name: str, 
                                achievement_description: str, badge_icon: str = None) -> Dict[str, Any]:
        """Create achievement for user"""
        data = {
            "user_id": user_id,
            "achievement_type": achievement_type,
            "achievement_name": achievement_name,
            "achievement_description": achievement_description,
            "badge_icon": badge_icon
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/achievements",
                headers=self.headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": response.text}
    
    async def update_study_streak(self, user_id: str, current_streak: int, longest_streak: int = None) -> Dict[str, Any]:
        """Update user's study streak"""
        data = {
            "current_streak": current_streak,
            "last_activity_date": datetime.now().date().isoformat()
        }
        
        if longest_streak is not None:
            data["longest_streak"] = longest_streak
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/study_streaks?user_id=eq.{user_id}",
                headers=self.headers,
                json=data
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            else:
                return {"success": False, "error": response.text}
    
    async def get_user_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's achievements"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/achievements?user_id=eq.{user_id}&order=earned_at.desc",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            return []
    
    async def get_user_study_streak(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's study streak info"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/study_streaks?user_id=eq.{user_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                streaks = response.json()
                return streaks[0] if streaks else None
            return None

# Singleton instance
supabase_service = SupabaseService()
