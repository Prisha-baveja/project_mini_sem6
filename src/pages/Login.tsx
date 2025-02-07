import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, School, User, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password, role);
        navigate(role === 'teacher' ? '/teacher' : '/student');
      } else {
        await signup(email, password, username, role);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            QuizDash
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
              role === 'student'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setRole('student')}
          >
            <School className="w-4 h-4" />
            Student
          </button>
          <button
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
              role === 'teacher'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setRole('teacher')}
          >
            <GraduationCap className="w-4 h-4" />
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'} </button>
        </p>
      </div>
    </div>
  );
}