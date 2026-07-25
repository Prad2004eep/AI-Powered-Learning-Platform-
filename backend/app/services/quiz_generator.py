import os
import httpx
import json
import random
import uuid
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.models import ContentChunk, QuestionType, DifficultyLevel
from app.services.learning_service import LearningService

class QuizGenerator:
    """
    Service for generating quiz questions using LLM.
    """
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.learning_service = LearningService()
        self.question_templates = {
            QuestionType.MCQ: {
                "math": [
                    "What is the result of {concept}?",
                    "Which of the following best describes {concept}?",
                    "Choose the correct answer for {concept}.",
                    "Solve the following problem: {concept}",
                    "Which formula would you use to calculate {concept}?"
                ],
                "science": [
                    "What happens when {concept}?",
                    "Which statement about {concept} is correct?",
                    "Select the best description of {concept}.",
                    "Explain the process of {concept}.",
                    "What is the relationship between {concept} and related factors?"
                ],
                "english": [
                    "What is the function of {concept} in writing?",
                    "Which sentence correctly uses {concept}?",
                    "Identify the {concept} in the given context.",
                    "How does {concept} improve writing clarity?",
                    "Choose the correct usage of {concept}."
                ],
                "history": [
                    "What was the significance of {concept}?",
                    "When did {concept} occur?",
                    "How did {concept} impact society?",
                    "What were the causes of {concept}?",
                    "Which statement about {concept} is historically accurate?"
                ],
                "geography": [
                    "Where is {concept} located?",
                    "What are the characteristics of {concept}?",
                    "How does {concept} affect the environment?",
                    "What is the relationship between {concept} and human activity?",
                    "Which statement best describes {concept}?"
                ],
                "computer_science": [
                    "How does {concept} work?",
                    "What is the purpose of {concept} in programming?",
                    "Which algorithm would best solve {concept}?",
                    "What are the advantages of using {concept}?",
                    "How would you implement {concept}?"
                ],
                "general": [
                    "What is {concept}?",
                    "Which statement about {concept} is correct?",
                    "How would you describe {concept}?",
                    "What are the key features of {concept}?",
                    "Why is {concept} important?"
                ]
            },
            QuestionType.TRUE_FALSE: [
                "True or False: {statement}",
                "Is the following statement true or false? {statement}",
                "Determine if this statement is correct: {statement}"
            ],
            QuestionType.FILL_BLANK: [
                "Complete the sentence: {sentence_with_blank}",
                "Fill in the blank: {sentence_with_blank}",
                "What word completes this sentence? {sentence_with_blank}"
            ]
        }
    
    async def generate_questions_from_chunks(self, chunks: List[ContentChunk], question_count: int = 20, pdf_content_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Generate quiz questions from content chunks using Groq API.
        """
        try:
            generated_questions = []
            
            # Check if Groq API key is available
            if self.groq_api_key and self.groq_api_key.startswith("gsk_"):
                # Use real Groq API with enhanced content awareness
                return await self._generate_with_groq(chunks, question_count, pdf_content_info)
            else:
                # Fallback to mock generation with content awareness
                return await self._generate_mock_questions(chunks, question_count, pdf_content_info)
            
        except Exception as e:
            print(f"Groq API failed, falling back to mock generation: {e}")
            return await self._generate_mock_questions(chunks, question_count, pdf_content_info)
    
    async def _generate_with_groq(self, chunks: List[ContentChunk], question_count: int, pdf_content_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Generate questions using real Groq API with enhanced content awareness."""
        generated_questions = []
        
        # Combine content from chunks
        combined_content = "\n\n".join([chunk.text for chunk in chunks])
        
        # Add context from PDF classification
        context_info = ""
        enhanced_params = {}
        
        if pdf_content_info:
            context_info = f"""
PDF Content Analysis:
- Subject: {pdf_content_info.get('subject', 'Unknown')}
- Grade Level: {pdf_content_info.get('grade_level', 'Unknown')}
- Topics: {', '.join(pdf_content_info.get('topics', []))}
- Confidence: {pdf_content_info.get('confidence', 0.0):.2f}
"""
            
            # Get enhanced parameters from learning service
            enhanced_params = self.learning_service.get_enhanced_generation_params(
                pdf_content_info.get('subject', 'General'),
                pdf_content_info.get('topics', [])
            )
        
        # Generate questions with different types and difficulties
        mcq_count = int(question_count * 0.6)  # 60% MCQ
        tf_count = int(question_count * 0.2)   # 20% True/False
        fill_count = question_count - mcq_count - tf_count  # Remaining Fill in blank
        
        # Generate MCQ questions
        for i in range(mcq_count):
            difficulty = self._assign_difficulty(i, mcq_count)
            question = await self._generate_mcq_with_groq(combined_content, difficulty, i + 1, context_info)
            if question:
                generated_questions.append(question)
        
        # Generate True/False questions
        for i in range(tf_count):
            difficulty = self._assign_difficulty(i, tf_count)
            question = await self._generate_tf_with_groq(combined_content, difficulty, i + 1, context_info)
            if question:
                generated_questions.append(question)
        
        # Generate Fill in the blank questions
        for i in range(fill_count):
            difficulty = self._assign_difficulty(i, fill_count)
            question = await self._generate_fill_with_groq(combined_content, difficulty, i + 1, context_info)
            if question:
                generated_questions.append(question)
        
        return generated_questions
    
    async def _generate_mcq_with_groq(self, content: str, difficulty: str, question_num: int, context_info: str = "") -> Dict[str, Any]:
        """Generate a multiple choice question using Groq API."""
        
        prompt = f"""
        You are an expert educational content creator specializing in {pdf_content_info.get('subject', 'General Studies')}.
        
        Based on the following content, generate a multiple choice question with {difficulty} difficulty.
        
        PDF Content Analysis:
        - Subject: {pdf_content_info.get('subject', 'Unknown')}
        - Grade Level: {pdf_content_info.get('grade_level', 'Unknown')}
        - Topics: {', '.join(pdf_content_info.get('topics', []))}
        - Confidence: {pdf_content_info.get('confidence', 0.0):.2f}
        
        Content:
        {content[:3000]}
        
        Instructions:
        1. Create a clear, meaningful question based on the actual content
        2. Provide 4 realistic options (A, B, C, D) that test understanding
        3. Make one option clearly correct based on the content
        4. Make distractors plausible but incorrect
        5. Mark the correct answer
        6. Provide a brief explanation based on the content
        7. Assign a quality score (0-100)
        
        Difficulty level: {difficulty}
        {self._get_difficulty_instructions(difficulty)}
        
        Subject-Specific Guidelines:
        {self._get_subject_guidelines(pdf_content_info.get('subject', 'General'))}
        
        Return the response in this JSON format:
        {{
            "question": "Question text here",
            "question_type": "mcq",
            "difficulty": "{difficulty}",
            "options": {{
                "A": "Option A text",
                "B": "Option B text", 
                "C": "Option C text",
                "D": "Option D text"
            }},
            "correct_answer": "A",
            "explanation": "Brief explanation based on content",
            "quality_score": 85
        }}
        """
        
        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama2-70b-4096",
                "messages": [
                    {"role": "system", "content": "You are an expert educational content creator. Generate high-quality quiz questions based on provided content."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.base_url, headers=headers, json=data, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    content_text = result["choices"][0]["message"]["content"]
                    
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        question_data = json.loads(json_match.group())
                        question_data["chunk_id"] = f"chunk_{question_num}"
                        return question_data
                
        except Exception as e:
            print(f"Error generating MCQ question: {e}")
        
        return None
    
    async def _generate_tf_with_groq(self, content: str, difficulty: str, question_num: int, context_info: str = "") -> Dict[str, Any]:
        """Generate a true/false question using Groq API."""
        
        prompt = f"""
        Based on the following content, generate a true/false question with {difficulty} difficulty.
        
        {context_info}
        
        Content:
        {content[:2000]}
        
        Instructions:
        1. Create a clear statement that can be evaluated as true or false
        2. Mark the correct answer (True or False)
        3. Provide a brief explanation
        4. Assign a quality score (0-100)
        
        Difficulty level: {difficulty}
        {self._get_difficulty_instructions(difficulty)}
        
        Return the response in this JSON format:
        {{
            "question": "Statement here",
            "question_type": "true_false",
            "difficulty": "{difficulty}",
            "options": {{
                "True": "True",
                "False": "False"
            }},
            "correct_answer": "True",
            "explanation": "Brief explanation",
            "quality_score": 85
        }}
        """
        
        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama2-70b-4096",
                "messages": [
                    {"role": "system", "content": "You are an expert educational content creator. Generate high-quality true/false questions based on provided content."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 300
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.base_url, headers=headers, json=data, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    content_text = result["choices"][0]["message"]["content"]
                    
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        question_data = json.loads(json_match.group())
                        question_data["chunk_id"] = f"chunk_{question_num}"
                        return question_data
                
        except Exception as e:
            print(f"Error generating True/False question: {e}")
        
        return None
    
    async def _generate_fill_with_groq(self, content: str, difficulty: str, question_num: int, context_info: str = "") -> Dict[str, Any]:
        """Generate a fill in the blank question using Groq API."""
        
        prompt = f"""
        Based on the following content, generate a fill in the blank question with {difficulty} difficulty.
        
        {context_info}
        
        Content:
        {content[:2000]}
        
        Instructions:
        1. Create a sentence with a blank (represented by _____)
        2. The blank should be filled with a specific word or phrase from the content
        3. Provide the correct answer
        4. Provide a brief explanation
        5. Assign a quality score (0-100)
        
        Difficulty level: {difficulty}
        {self._get_difficulty_instructions(difficulty)}
        
        Return the response in this JSON format:
        {{
            "question": "Sentence with _____ blank",
            "question_type": "fill_blank",
            "difficulty": "{difficulty}",
            "options": {{
                "answer": "The correct answer"
            }},
            "correct_answer": "answer",
            "explanation": "Brief explanation",
            "quality_score": 85
        }}
        """
        
        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama2-70b-4096",
                "messages": [
                    {"role": "system", "content": "You are an expert educational content creator. Generate high-quality fill in the blank questions based on provided content."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 300
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.base_url, headers=headers, json=data, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    content_text = result["choices"][0]["message"]["content"]
                    
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        question_data = json.loads(json_match.group())
                        question_data["chunk_id"] = f"chunk_{question_num}"
                        return question_data
                
        except Exception as e:
            print(f"Error generating Fill in blank question: {e}")
        
        return None
    
    async def _generate_mock_questions(self, chunks: List[ContentChunk], question_count: int, pdf_content_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Fallback mock question generation."""
        generated_questions = []
        
        # Distribute questions across chunks
        chunks_per_question = max(1, len(chunks) // question_count)
        
        for i in range(question_count):
            # Select chunk
            chunk_index = (i * chunks_per_question) % len(chunks)
            chunk = chunks[chunk_index]
            
            # Determine question type
            question_type = self._select_question_type()
            
            # Determine difficulty
            difficulty = self._select_difficulty()
            
            # Generate question based on type
            if question_type == QuestionType.MCQ:
                question_data = self._generate_mcq(chunk, difficulty)
            elif question_type == QuestionType.TRUE_FALSE:
                question_data = self._generate_true_false(chunk, difficulty)
            else:  # FILL_BLANK
                question_data = self._generate_fill_blank(chunk, difficulty)
            
            # Add metadata
            question_data.update({
                "chunk_id": chunk.id,
                "question_type": question_type.value if hasattr(question_type, 'value') else str(question_type),
                "difficulty": difficulty.value if hasattr(difficulty, 'value') else str(difficulty),
                "quality_score": self._calculate_quality_score(question_data)
            })
            
            generated_questions.append(question_data)
        
        return generated_questions
    
    def _assign_difficulty(self, index: int, total: int) -> str:
        """Assign difficulty based on position in sequence."""
        if index < total * 0.25:
            return "easy"
        elif index < total * 0.5:
            return "medium"
        elif index < total * 0.75:
            return "hard"
        else:
            return "expert"
    
    def _get_subject_guidelines(self, subject: str) -> str:
        """Get specific guidelines for different subjects."""
        guidelines = {
            "Mathematics": "Focus on problem-solving, calculations, formulas, and mathematical reasoning. Questions should test understanding of concepts and procedures.",
            "Science": "Emphasize scientific processes, experimental thinking, cause-effect relationships, and understanding of natural phenomena.",
            "English": "Test grammar rules, writing mechanics, reading comprehension, and literary analysis skills.",
            "History": "Focus on chronological understanding, cause-effect relationships, historical context, and significance of events.",
            "Geography": "Emphasize spatial relationships, physical and human geography, and understanding of geographical concepts.",
            "Computer Science": "Test programming logic, algorithmic thinking, system design, and technical understanding.",
            "General": "Focus on main ideas, key concepts, practical applications, and fundamental understanding."
        }
        return guidelines.get(subject, guidelines["General"])
    
    def _get_difficulty_instructions(self, difficulty: str) -> str:
        """Get specific instructions for difficulty level."""
        instructions = {
            "easy": "Focus on basic facts and definitions. Questions should be straightforward and test fundamental knowledge.",
            "medium": "Include some analysis and application. Questions should require understanding of concepts and basic problem-solving.",
            "hard": "Require critical thinking and synthesis. Questions should involve complex scenarios and deeper understanding.",
            "expert": "Test mastery and advanced application. Questions should be challenging and require comprehensive knowledge."
        }
        return instructions.get(difficulty, "")
    
    def _select_question_type(self) -> QuestionType:
        """
        Select a question type based on distribution.
        """
        # 60% MCQ, 25% True/False, 15% Fill in the blank
        rand = random.random()
        if rand < 0.6:
            return QuestionType.MCQ
        elif rand < 0.85:
            return QuestionType.TRUE_FALSE
        else:
            return QuestionType.FILL_BLANK
    
    def _select_difficulty(self) -> DifficultyLevel:
        """
        Select difficulty level based on distribution.
        """
        # 40% Easy, 35% Medium, 20% Hard, 5% Expert
        rand = random.random()
        if rand < 0.4:
            return DifficultyLevel.EASY
        elif rand < 0.75:
            return DifficultyLevel.MEDIUM
        elif rand < 0.95:
            return DifficultyLevel.HARD
        else:
            return DifficultyLevel.EXPERT
    
    def _generate_mcq(self, chunk: ContentChunk, difficulty: DifficultyLevel) -> Dict[str, Any]:
        """
        Generate a multiple choice question.
        """
        text = chunk.text
        
        # Extract key concepts from text
        concepts = self._extract_concepts(text)
        
        if not concepts:
            # Fallback to a generic question
            return self._generate_generic_mcq(chunk, difficulty)
        
        # Select a concept
        concept = random.choice(concepts)
        
        # Generate question based on difficulty
        if difficulty == DifficultyLevel.EASY:
            question, correct_answer, options = self._generate_easy_mcq(concept, text)
        elif difficulty == DifficultyLevel.MEDIUM:
            question, correct_answer, options = self._generate_medium_mcq(concept, text)
        elif difficulty == DifficultyLevel.HARD:
            question, correct_answer, options = self._generate_hard_mcq(concept, text)
        else:  # EXPERT
            question, correct_answer, options = self._generate_expert_mcq(concept, text)
        
        return {
            "question": question,
            "correct_answer": correct_answer,
            "options": options,
            "explanation": self._generate_explanation(concept, text, correct_answer)
        }
    
    def _generate_true_false(self, chunk: ContentChunk, difficulty: DifficultyLevel) -> Dict[str, Any]:
        """
        Generate a true/false question.
        """
        text = chunk.text
        
        # Extract factual statements
        statements = self._extract_statements(text)
        
        if not statements:
            # Fallback
            statement = f"The text discusses {chunk.topic or 'various concepts'}."
            is_true = True
        else:
            statement = random.choice(statements)
            # Randomly decide if we want to make it true or false
            is_true = random.choice([True, False])
            if not is_true:
                statement = self._make_statement_false(statement)
        
        question = f"True or False: {statement}"
        correct_answer = "True" if is_true else "False"
        
        return {
            "question": question,
            "correct_answer": correct_answer,
            "options": None,
            "explanation": f"The statement is {'correct' if is_true else 'incorrect'} based on the text."
        }
    
    def _generate_fill_blank(self, chunk: ContentChunk, difficulty: DifficultyLevel) -> Dict[str, Any]:
        """
        Generate a fill in the blank question.
        """
        text = chunk.text
        
        # Extract key terms
        terms = self._extract_key_terms(text)
        
        if not terms:
            # Fallback
            sentence = f"A {chunk.topic or 'concept'} is important for learning."
            blank_word = chunk.topic or "concept"
        else:
            term = random.choice(terms)
            sentence = self._create_sentence_with_blank(term, text)
            blank_word = term
        
        question = f"Fill in the blank: {sentence}"
        correct_answer = blank_word
        
        return {
            "question": question,
            "correct_answer": correct_answer,
            "options": None,
            "explanation": f"The correct word to complete the sentence is '{blank_word}'."
        }
    
    def _extract_concepts(self, text: str) -> List[str]:
        """
        Extract key concepts from text.
        """
        # Simple concept extraction - can be enhanced with NLP
        concepts = []
        
        # Look for definitions
        definition_patterns = [
            r'(\w+) is a',
            r'(\w+) are',
            r'A (\w+) is',
            r'An (\w+) is',
            r'(\w+) refers to'
        ]
        
        for pattern in definition_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            concepts.extend(matches)
        
        # Look for mathematical terms
        math_terms = ['triangle', 'square', 'circle', 'addition', 'subtraction', 'multiplication', 'division']
        for term in math_terms:
            if term.lower() in text.lower():
                concepts.append(term)
        
        return list(set(concepts))
    
    def _extract_statements(self, text: str) -> List[str]:
        """
        Extract factual statements from text.
        """
        # Split into sentences and filter for factual statements
        sentences = text.split('.')
        statements = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 10 and any(keyword in sentence.lower() for keyword in ['is', 'are', 'has', 'have']):
                statements.append(sentence)
        
        return statements
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """
        Extract key terms from text.
        """
        # Simple keyword extraction
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
        
        words = text.lower().split()
        key_terms = []
        
        for word in words:
            if len(word) > 3 and word not in common_words and word.isalpha():
                key_terms.append(word)
        
        return list(set(key_terms))
    
    def _generate_easy_mcq(self, concept: str, text: str) -> tuple:
        """
        Generate an easy multiple choice question.
        """
        question = f"What is {concept}?"
        
        # Extract or create correct answer
        correct_answer = self._find_definition(concept, text) or f"A basic {concept}"
        
        # Generate simple distractors
        options = [correct_answer]
        distractors = [
            f"Not a {concept}",
            f"A different {concept}",
            f"Something else"
        ]
        options.extend(distractors)
        random.shuffle(options)
        
        return question, correct_answer, options
    
    def _generate_medium_mcq(self, concept: str, text: str) -> tuple:
        """
        Generate a medium difficulty multiple choice question.
        """
        question = f"Which statement best describes {concept}?"
        
        # Extract more detailed information
        correct_answer = self._find_characteristic(concept, text) or f"{concept} has specific properties"
        
        # Generate more sophisticated distractors
        options = [correct_answer]
        distractors = [
            f"{concept} is the opposite of what it actually is",
            f"{concept} has no important features",
            f"{concept} is similar to other concepts but distinct"
        ]
        options.extend(distractors)
        random.shuffle(options)
        
        return question, correct_answer, options
    
    def _generate_hard_mcq(self, concept: str, text: str) -> tuple:
        """
        Generate a hard multiple choice question.
        """
        question = f"Which of the following is a key characteristic that distinguishes {concept} from similar concepts?"
        
        # Extract detailed technical information
        correct_answer = self._find_technical_detail(concept, text) or f"{concept} has unique technical properties"
        
        # Generate technical distractors
        options = [correct_answer]
        distractors = [
            f"{concept} shares all properties with similar concepts",
            f"{concept} has no distinguishing features",
            f"{concept} is defined by its relationship to other concepts"
        ]
        options.extend(distractors)
        random.shuffle(options)
        
        return question, correct_answer, options
    
    def _generate_expert_mcq(self, concept: str, text: str) -> tuple:
        """
        Generate an expert level multiple choice question.
        """
        question = f"Analyze the advanced properties of {concept} and select the most accurate statement:"
        
        # Extract expert-level information
        correct_answer = self._find_expert_detail(concept, text) or f"{concept} demonstrates advanced theoretical principles"
        
        # Generate expert-level distractors
        options = [correct_answer]
        distractors = [
            f"{concept} follows simplified rules only",
            f"{concept} cannot be analyzed at an advanced level",
            f"{concept} has no theoretical basis"
        ]
        options.extend(distractors)
        random.shuffle(options)
        
        return question, correct_answer, options
    
    def _generate_generic_mcq(self, chunk: ContentChunk, difficulty: DifficultyLevel) -> Dict[str, Any]:
        """
        Generate a generic MCQ when specific concept extraction fails.
        """
        topic = chunk.topic or "the concept"
        question = f"What is the main topic of this passage about {topic}?"
        
        correct_answer = f"The passage discusses {topic}"
        options = [
            correct_answer,
            f"The passage is about unrelated topics",
            f"The passage has no main topic",
            f"The passage discusses multiple topics without focus"
        ]
        random.shuffle(options)
        
        return {
            "question": question,
            "correct_answer": correct_answer,
            "options": options,
            "explanation": f"The passage focuses on {topic} as the main subject."
        }
    
    def _find_definition(self, concept: str, text: str) -> Optional[str]:
        """
        Find definition of concept in text.
        """
        patterns = [
            f'{concept} is ([^.]+)',
            f'{concept} are ([^.]+)',
            f'A {concept} is ([^.]+)',
            f'An {concept} is ([^.]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _find_characteristic(self, concept: str, text: str) -> Optional[str]:
        """
        Find characteristic of concept in text.
        """
        # Look for sentences with the concept
        sentences = text.split('.')
        for sentence in sentences:
            if concept.lower() in sentence.lower() and len(sentence) > 20:
                return sentence.strip()
        
        return None
    
    def _find_technical_detail(self, concept: str, text: str) -> Optional[str]:
        """
        Find technical detail about concept.
        """
        # Look for sentences with technical terms
        technical_words = ['degrees', 'sides', 'angles', 'formula', 'calculate', 'measure', 'property']
        sentences = text.split('.')
        
        for sentence in sentences:
            if concept.lower() in sentence.lower() and any(word in sentence.lower() for word in technical_words):
                return sentence.strip()
        
        return None
    
    def _find_expert_detail(self, concept: str, text: str) -> Optional[str]:
        """
        Find expert-level detail about concept.
        """
        # Look for complex sentences
        sentences = text.split('.')
        for sentence in sentences:
            if concept.lower() in sentence.lower() and len(sentence) > 50:
                return sentence.strip()
        
        return None
    
    def _make_statement_false(self, statement: str) -> str:
        """
        Modify a true statement to make it false.
        """
        # Simple negation - can be made more sophisticated
        false_words = ['never', 'always', 'only', 'exactly']
        for word in false_words:
            if word not in statement:
                return statement.replace(' is ', f' is {word} ')
        
        return statement + " This is false."
    
    def _create_sentence_with_blank(self, term: str, text: str) -> str:
        """
        Create a sentence with a blank for the term.
        """
        # Find a sentence containing the term
        sentences = text.split('.')
        for sentence in sentences:
            if term.lower() in sentence.lower():
                return sentence.replace(term, "_____").strip()
        
        # Fallback
        return f"A _____ is an important concept in this topic."
    
    def _generate_explanation(self, concept: str, text: str, correct_answer: str) -> str:
        """
        Generate explanation for the answer.
        """
        return f"Based on the text, {correct_answer}. This relates to {concept} as discussed in the passage."
    
    def _calculate_quality_score(self, question_data: Dict[str, Any]) -> float:
        """
        Calculate quality score for generated question.
        """
        score = 0.0
        
        # Question length (should be reasonable)
        question = question_data.get("question", "")
        if 10 <= len(question) <= 200:
            score += 0.3
        
        # Answer clarity
        answer = question_data.get("correct_answer", "")
        if len(answer) > 0:
            score += 0.2
        
        # Options quality for MCQ
        options = question_data.get("options", [])
        if options and len(options) == 4:
            score += 0.3
        
        # Explanation presence
        if question_data.get("explanation"):
            score += 0.2
        
        return min(score, 1.0)
