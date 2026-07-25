-- ========================================
-- QUIZAI SUPABASE DATABASE SETUP
-- ========================================
-- Run this SQL in your Supabase SQL Editor
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'educator')),
  grade TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. QUIZ_SESSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  topic TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 4),
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_response_time FLOAT DEFAULT 0.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. STUDENT_ANSWERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time FLOAT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  question_type TEXT CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. USER_PREFERENCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_subjects TEXT[],
  difficulty_preference INTEGER DEFAULT 1 CHECK (difficulty_preference >= 1 AND difficulty_preference <= 4),
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. ACHIEVEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_quiz', 'perfect_score', 'speed_demon', 'level_up', 'streak', 'subject_master')),
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. STUDY_STREAKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student_id ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON study_streaks(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES TABLE POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ========================================
-- QUIZ_SESSIONS TABLE POLICIES
-- ========================================

-- Users can view their own quiz sessions
CREATE POLICY "Users can view own quiz sessions" ON quiz_sessions
  FOR SELECT USING (auth.uid() = student_id);

-- Users can insert their own quiz sessions
CREATE POLICY "Users can insert own quiz sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Users can update their own quiz sessions
CREATE POLICY "Users can update own quiz sessions" ON quiz_sessions
  FOR UPDATE USING (auth.uid() = student_id);

-- Users can delete their own quiz sessions
CREATE POLICY "Users can delete own quiz sessions" ON quiz_sessions
  FOR DELETE USING (auth.uid() = student_id);

-- ========================================
-- STUDENT_ANSWERS TABLE POLICIES
-- ========================================

-- Users can view answers from their own sessions
CREATE POLICY "Users can view own student answers" ON student_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = student_answers.session_id 
      AND quiz_sessions.student_id = auth.uid()
    )
  );

-- Users can insert answers to their own sessions
CREATE POLICY "Users can insert own student answers" ON student_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = student_answers.session_id 
      AND quiz_sessions.student_id = auth.uid()
    )
  );

-- Users can update answers in their own sessions
CREATE POLICY "Users can update own student answers" ON student_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = student_answers.session_id 
      AND quiz_sessions.student_id = auth.uid()
    )
  );

-- Users can delete answers from their own sessions
CREATE POLICY "Users can delete own student answers" ON student_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = student_answers.session_id 
      AND quiz_sessions.student_id = auth.uid()
    )
  );

-- ========================================
-- USER_PREFERENCES TABLE POLICIES
-- ========================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ACHIEVEMENTS TABLE POLICIES
-- ========================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own achievements
CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own achievements
CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- STUDY_STREAKS TABLE POLICIES
-- ========================================

-- Users can view their own study streaks
CREATE POLICY "Users can view own study streaks" ON study_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own study streaks
CREATE POLICY "Users can insert own study streaks" ON study_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own study streaks
CREATE POLICY "Users can update own study streaks" ON study_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own study streaks
CREATE POLICY "Users can delete own study streaks" ON study_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS FOR AUTOMATIC PROFILE CREATION
-- ========================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  -- Create default preferences for new user
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Initialize study streaks for new user
  INSERT INTO public.study_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- UPDATED_AT TIMESTAMP TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_streaks_updated_at BEFORE UPDATE ON study_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- User dashboard stats view
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
  p.id as user_id,
  p.name,
  p.email,
  p.role,
  p.grade,
  COUNT(qs.id) as total_sessions,
  COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN qs.start_time >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as sessions_this_week,
  AVG(CASE WHEN qs.questions_answered > 0 THEN (qs.correct_answers::float / qs.questions_answered) * 100 END) as average_accuracy,
  MAX(qs.start_time) as last_quiz_date,
  COALESCE(ss.current_streak, 0) as current_streak,
  COALESCE(ss.longest_streak, 0) as longest_streak
FROM profiles p
LEFT JOIN quiz_sessions qs ON p.id = qs.student_id
LEFT JOIN study_streaks ss ON p.id = ss.user_id
GROUP BY p.id, p.name, p.email, p.role, p.grade, ss.current_streak, ss.longest_streak;

-- Recent activity view
CREATE OR REPLACE VIEW public.recent_user_activity AS
SELECT 
  p.id as user_id,
  p.name,
  qs.id as session_id,
  qs.subject,
  qs.topic,
  qs.start_time,
  qs.end_time,
  qs.questions_answered,
  qs.correct_answers,
  qs.current_level,
  qs.status,
  CASE 
    WHEN qs.questions_answered > 0 THEN (qs.correct_answers::float / qs.questions_answered) * 100 
    ELSE 0 
  END as accuracy
FROM profiles p
JOIN quiz_sessions qs ON p.id = qs.student_id
ORDER BY qs.start_time DESC;

-- ========================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ========================================

-- Uncomment these lines to insert sample data for testing

-- INSERT INTO public.profiles (id, name, email, role, grade) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Demo Student', 'student@quizai.com', 'student', '10'),
-- ('00000000-0000-0000-0000-000000000002', 'Demo Educator', 'educator@quizai.com', 'educator', NULL);

-- INSERT INTO public.quiz_sessions (student_id, subject, topic, status, questions_answered, correct_answers, current_level) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Mathematics', 'Geometry', 'completed', 10, 8, 2),
-- ('00000000-0000-0000-0000-000000000001', 'Science', 'Biology', 'active', 5, 4, 1);

-- INSERT INTO public.student_answers (session_id, question_id, selected_answer, is_correct, response_time, difficulty_level, question_type) VALUES
-- ((SELECT id FROM quiz_sessions WHERE student_id = '00000000-0000-0000-0000-000000000001' LIMIT 1), 'q1', '3', true, 4.5, 'easy', 'mcq'),
-- ((SELECT id FROM quiz_sessions WHERE student_id = '00000000-0000-0000-0000-000000000001' LIMIT 1), 'q2', 'false', false, 2.1, 'easy', 'true_false');


-- ========================================
-- SETUP COMPLETE
-- ========================================

-- Verify setup
SELECT 'Setup completed successfully!' as status;

-- Show created tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
