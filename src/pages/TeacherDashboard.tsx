import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Book, LogOut, Plus, List, BarChart, Users, Award } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { FaChalkboard } from "react-icons/fa";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  created_at: string;
}

interface Analytics {
  totalStudents: number;
  totalQuizzes: number;
  averageScore: number;
  completionRate: number;
  scoresByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

// function Sidebar() {
//   const logout = useAuthStore((state) => state.logout);
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   return (
//     <div className="bg-white w-64 min-h-screen shadow-lg">
//       <div className="p-4">
//         <h1 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
//           <GraduationCap className="w-6 h-6" />
//           QuizDash
//         </h1>
//       </div>
//       <nav className="mt-8">
//         <Link
//           to="/teacher"
//           className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
//         >
//           <Book className="w-5 h-5" />
//           Questions
//         </Link>
//         <Link
//           to="/teacher/quizzes"
//           className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
//         >
//           <List className="w-5 h-5" />
//           Quizzes
//         </Link>
//         <Link
//           to="/teacher/stats"
//           className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
//         >
//           <BarChart className="w-5 h-5" />
//           Statistics
//         </Link>
//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left"
//         >
//           <LogOut className="w-5 h-5" />
//           Logout
//         </button>
//       </nav>
//     </div>
//   );
// }

function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          QuizDash
        </h1>
      </div>
      <nav className="mt-8">
        <Link
          to="/teacher/classes"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <FaChalkboard className="w-5 h-5" />
          Classes
        </Link>
        <Link
          to="/teacher"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <Book className="w-5 h-5" />
          Questions
        </Link>
        <Link
          to="/teacher/quizzes"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <List className="w-5 h-5" />
          Quizzes
        </Link>
        <Link
          to="/teacher/stats"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <BarChart className="w-5 h-5" />
          Statistics
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>
    </div>
  );
}

function TeacherClasses() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // When component mounts, log and load subjects
  useEffect(() => {
    console.log("TeacherClasses component mounted.");
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    console.log("Loading subjects from Supabase...");
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        console.log("Fetched subjects:", data);
        setSubjects(data || []);
      }
    } catch (err) {
      console.error("Unexpected error in loadSubjects:", err);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      console.log("New subject input is empty.");
      return;
    }
    console.log("Adding new subject:", newSubject.trim());
    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert([{ subject_name: newSubject.trim(), created_by: user?.id }]);
      if (error) {
        console.error("Error adding subject:", error);
        alert("An error occurred while adding the subject.");
      } else {
        console.log("Subject added successfully:", data);
        setNewSubject("");
        setShowForm(false);
        loadSubjects(); // Reload subjects after insertion
      }
    } catch (err) {
      console.error("Unexpected error in handleAddSubject:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Classes</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        {showForm ? "Cancel" : "Add Subject"}
      </button>

      {showForm && (
        <form onSubmit={handleAddSubject} className="mb-6">
          <input
            type="text"
            placeholder="Enter Subject Name"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="border rounded px-4 py-2 mr-2"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Class
          </button>
        </form>
      )}

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          No subjects available. Add one to create a class.
        </p>
      ) : (
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <span className="text-lg font-medium">
                {subject.subject_name}
              </span>
              <button
                onClick={() => navigate(`/teacher/classes/${subject.id}`)}
                className="text-purple-600 hover:text-purple-800"
              >
                Open Class
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Statistics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Get total students
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Get total quizzes
    const { count: quizCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    // Get average score and completion rate
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score, quiz:quizzes(difficulty)');

    let totalScore = 0;
    const scoresByDifficulty = { easy: 0, medium: 0, hard: 0 };
    const countByDifficulty = { easy: 0, medium: 0, hard: 0 };

    attempts?.forEach(attempt => {
      totalScore += attempt.score;
      const difficulty = attempt.quiz.difficulty as 'easy' | 'medium' | 'hard';
      scoresByDifficulty[difficulty] += attempt.score;
      countByDifficulty[difficulty]++;
    });

    const averageScore = attempts?.length ? totalScore / attempts.length : 0;
    const completionRate = attempts?.length ? (attempts.length / (studentCount || 1)) * 100 : 0;

    Object.keys(scoresByDifficulty).forEach(key => {
      const k = key as 'easy' | 'medium' | 'hard';
      scoresByDifficulty[k] = countByDifficulty[k] ? 
        scoresByDifficulty[k] / countByDifficulty[k] : 0;
    });

    setAnalytics({
      totalStudents: studentCount || 0,
      totalQuizzes: quizCount || 0,
      averageScore,
      completionRate,
      scoresByDifficulty,
    });
  };

  if (!analytics) return null;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalQuizzes}</p>
            </div>
            <Book className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageScore.toFixed(1)}%</p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.completionRate.toFixed(1)}%</p>
            </div>
            <BarChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Scores by Difficulty</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(analytics.scoresByDifficulty).map(([difficulty, score]) => (
            <div key={difficulty} className="text-center">
              <p className="text-sm text-gray-500 capitalize">{difficulty}</p>
              <p className="text-xl font-bold text-gray-900">{score.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionForm({ onSubmit, initialData = null }: { onSubmit: (data: any) => void; initialData?: any }) {
  const [question, setQuestion] = useState(initialData?.question || '');
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correct_answer || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'medium');
  const [category, setCategory] = useState(initialData?.category || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      question,
      options,
      correct_answer: correctAnswer,
      difficulty,
      category,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Options</label>
        {options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[index] = e.target.value;
              setOptions(newOptions);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder={`Option ${index + 1}`}
            required
          />
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
        <select
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        >
          <option value="">Select correct answer</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        {initialData ? 'Update Question' : 'Add Question'}
      </button>
    </form>
  );
}

function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadQuestions();
  }, []);

  const fetchUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching user:", error);
    } else {
      console.log("Auth UID:", data?.user?.id);
    }
  };
  fetchUser();


  const loadQuestions = async () => {
    console.log("loading questions..");
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log("error fetching questions", error);
      alert("an error occured while fetching questions");
    }
    else{
       console.log("Fetched Questions:", data);
       setQuestions(data || []);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingQuestion) {
      await supabase
        .from('questions')
        .update(data)
        .eq('id', editingQuestion.id);
    } else {
      await supabase
        .from('questions')
        .insert([{ ...data, created_by: user?.id }]);
    }
    
    setShowForm(false);
    setEditingQuestion(null);
    loadQuestions();
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    console.log(`Attempting to delete question with ID: ${id}`); // Log the ID

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this question?"
    );
    if (confirmDelete) {
      console.log("User confirmed deletion"); // Log confirmation

      const { error } = await supabase.from("questions").delete().eq("id", id);

      if (error) {
        console.error("Error deleting question:", error);
        alert("An error occurred while deleting the question.");
      } else {
        console.log("Question deleted successfully");
        loadQuestions();
      }
    } else {
      console.log("User canceled deletion"); // Log cancellation
    }
  };


  // console.log("Auth UID:", supabase.auth.getUser());

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <QuestionForm onSubmit={handleSubmit} initialData={editingQuestion} />
        </div>
      )}

      <div className="grid gap-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {question.difficulty}
                </span>
                <button
                  onClick={() => handleEdit(question)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    option === question.correct_answer
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50'
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Subject: {question.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [numQuestions, setNumQuestions] = useState(10);
  // const [availableCategories, setAvailableCategories] = useState<string[]>([]);
const [categories, setCategories] = useState<string[]>([]);
const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!title.trim()) throw new Error('Title is required');
      if (timeLimit < 1 || timeLimit > 180) throw new Error('Time limit must be between 1 and 180 minutes');
      if (numQuestions < 1) throw new Error('Must include at least one question');
      if (!category) throw new Error('Category selection is important');

      setCategory(category)
      const { data: questions, error: questionError } = await supabase
        .from("questions")
        .select("id")
        .eq("difficulty", difficulty)
        .eq("category", category);
      if (questionError) throw new Error('Failed to fetch questions');
      if (!questions || questions.length < numQuestions) {
        throw new Error('Not enough questions available for the selected criteria');
      }
      const questionIds = questions.map((q) => q.id);
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert([{
          title: title.trim(),
          description: description.trim(),
          difficulty,
          time_limit: timeLimit,
          questions: questionIds,
          created_by: user?.id
        }]);

      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw new Error('Failed to create quiz');
      }

      navigate('/teacher/quizzes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("category", { distinct: true }); // Fetch unique categories

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      const uniqueCategories = [...new Set(data.map((q) => q.category))]; // Ensure uniqueness
      setCategories(uniqueCategories);
    }
  };

  fetchCategories();
}, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as "easy" | "medium" | "hard")
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Number of Questions
          </label>
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            min="1"
            max="50"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            min="1"
            max="180"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating Quiz..." : "Create Quiz"}
        </button>
      </form>
    </div>
  );
}
function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setQuizzes(data);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quiz?"
    );
    if (!confirmDelete) {
      console.log("Deletion canceled by the user.");
      return;
    }

    try {
      // Using .select() here will return the deleted rows (if your RLS policies allow deletion)
      const { data, error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error deleting quiz:", error);
      } else {
        console.log("Deleted rows:", data);
      }

      // Optionally, you could log here before calling loadQuizzes() if that function causes a reload.
      loadQuizzes();
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
    }
  };

  const handleReleaseAnswers = async (id: string) => {
    const { error } = await supabase
      .from("quizzes")
      .update({ answers_released: true })
      .eq("id", id);

    if (error) {
      console.error("Error releasing answers:", error);
    } else {
      alert("Answers released successfully!");
    }
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
        <button
          onClick={() => navigate("/teacher/quizzes/create")}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Create Quiz
        </button>
      </div>
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {quiz.title}
                </h3>
                <p className="text-gray-500">{quiz.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleReleaseAnswers(quiz.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Release Answers
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Time limit: {quiz.time_limit} minutes
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/" element={<Questions />} />
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quizzes/create" element={<CreateQuiz />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </div>
    </div>
  );
}