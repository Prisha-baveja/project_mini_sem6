import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { GraduationCap,Book,LogOut,Plus,List,BarChart,Users,Award,User } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { FaChalkboard } from "react-icons/fa";
import { PlusCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { Edit, Trash2 } from "react-feather";

interface Class {
  id: string;
  name: string;
  description: string;
  join_code: string;
  // Add other properties if needed
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
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

function Statistics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Get total students
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // Get total quizzes
    const { count: quizCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    // Get average score and completion rate
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score, quiz:quizzes(difficulty)");

    let totalScore = 0;
    const scoresByDifficulty = { easy: 0, medium: 0, hard: 0 };
    const countByDifficulty = { easy: 0, medium: 0, hard: 0 };

    attempts?.forEach((attempt) => {
      totalScore += attempt.score;
      const difficulty = attempt.quiz.difficulty as "easy" | "medium" | "hard";
      scoresByDifficulty[difficulty] += attempt.score;
      countByDifficulty[difficulty]++;
    });

    const averageScore = attempts?.length ? totalScore / attempts.length : 0;
    const completionRate = attempts?.length
      ? (attempts.length / (studentCount || 1)) * 100
      : 0;

    Object.keys(scoresByDifficulty).forEach((key) => {
      const k = key as "easy" | "medium" | "hard";
      scoresByDifficulty[k] = countByDifficulty[k]
        ? scoresByDifficulty[k] / countByDifficulty[k]
        : 0;
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Analytics Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalStudents}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalQuizzes}
              </p>
            </div>
            <Book className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageScore.toFixed(1)}%
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.completionRate.toFixed(1)}%
              </p>
            </div>
            <BarChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Scores by Difficulty
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(analytics.scoresByDifficulty).map(
            ([difficulty, score]) => (
              <div key={difficulty} className="text-center">
                <p className="text-sm text-gray-500 capitalize">{difficulty}</p>
                <p className="text-xl font-bold text-gray-900">
                  {score.toFixed(1)}%
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// function Classes() {
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [newClassName, setNewClassName] = useState("");
//   const [newClassDescription, setNewClassDescription] = useState("");
//   const user = useAuthStore((state) => state.user);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       loadClasses();
//     }
//   }, [user]);

//   const loadClasses = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("classes")
//         .select("*")
//         .eq("created_by", user?.id)
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       if (data) {
//         setClasses(data);
//       }
//     } catch (err) {
//       console.error("Error loading classes:", err);
//     }
//   };

//   const handleCreateClass = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) return;

//     try {
//       // Generate an 8-character unique join code
//       const joinCode = nanoid(8);

//       const { error } = await supabase.from("classes").insert([
//         {
//           name: newClassName.trim(),
//           description: newClassDescription.trim(),
//           created_by: user.id,
//           join_code: joinCode, // Store the join code with the class record
//         },
//       ]);

//       if (error) throw error;

//       setNewClassName("");
//       setNewClassDescription("");
//       setShowCreateForm(false);
//       loadClasses();
//     } catch (err) {
//       console.error("Error creating class:", err);
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
//         <button
//           onClick={() => setShowCreateForm(true)}
//           className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
//         >
//           <PlusCircle className="w-5 h-5" />
//           Create Class
//         </button>
//       </div>

//       {showCreateForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Create New Class</h3>
//             <form onSubmit={handleCreateClass}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Class Name
//                 </label>
//                 <input
//                   type="text"
//                   value={newClassName}
//                   onChange={(e) => setNewClassName(e.target.value)}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Description
//                 </label>
//                 <textarea
//                   value={newClassDescription}
//                   onChange={(e) => setNewClassDescription(e.target.value)}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   rows={3}
//                 />
//               </div>
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateForm(false)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
//                 >
//                   Create
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <div className="grid gap-4">
//         {classes.map((cls) => (
//           <div
//             key={cls.id}
//             className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
//           >
//             <div>
//               <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
//               <p className="text-gray-500">{cls.description}</p>
//             </div>
//             <div className="flex justify-between items-center mt-4">
//               <button
//                 onClick={() => navigate(`/teacher/classes/${cls.id}`)}
//                 className="text-purple-600 hover:text-purple-800"
//               >
//                 View Questions
//               </button>
//               <p className="text-gray-500">Class Code: {cls.join_code}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function Classes() {
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [newClassName, setNewClassName] = useState("");
//   const [newClassDescription, setNewClassDescription] = useState("");
//   const user = useAuthStore((state) => state.user);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       loadClasses();
//     }
//   }, [user]);

//   const loadClasses = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("classes")
//         .select("*")
//         .eq("created_by", user?.id)
//         .order("created_at", { ascending: false });
//       if (error) throw error;
//       if (data) {
//         setClasses(data);
//       }
//     } catch (err) {
//       console.error("Error loading classes:", err);
//     }
//   };

//   const handleCreateClass = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) return;

//     try {
//       // Generate an 8-character unique join code
//       const joinCode = nanoid(8);

//       const { error } = await supabase.from("classes").insert([
//         {
//           name: newClassName.trim(),
//           description: newClassDescription.trim(),
//           created_by: user.id,
//           join_code: joinCode,
//         },
//       ]);

//       if (error) throw error;

//       setNewClassName("");
//       setNewClassDescription("");
//       setShowCreateForm(false);
//       loadClasses();
//     } catch (err) {
//       console.error("Error creating class:", err);
//     }
//   };

//   // New function to delete a class
//   const handleDeleteClass = async (id: string) => {
//     // Confirm deletion
//     if (!window.confirm("Are you sure you want to delete this class?")) return;

//     try {
//       // Delete only if the current user is the creator
//       const { error } = await supabase
//         .from("classes")
//         .delete()
//         .eq("id", id)
//         .eq("created_by", user.id);

//       if (error) throw error;
//       // Update the local state to remove the deleted class
//       setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== id));
//     } catch (err) {
//       console.error("Error deleting class:", err);
//     }
//   };

//   // Optionally, if you still want to fetch subjects (or class names) to fill a dropdown,
//   // you could do that in a separate useEffect.

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
//         <button
//           onClick={() => setShowCreateForm(true)}
//           className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
//         >
//           <PlusCircle className="w-5 h-5" />
//           Create Class
//         </button>
//       </div>

//       {showCreateForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Create New Class</h3>
//             <form onSubmit={handleCreateClass}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Class Name
//                 </label>
//                 <input
//                   type="text"
//                   value={newClassName}
//                   onChange={(e) => setNewClassName(e.target.value)}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Description
//                 </label>
//                 <textarea
//                   value={newClassDescription}
//                   onChange={(e) => setNewClassDescription(e.target.value)}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   rows={3}
//                 />
//               </div>
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateForm(false)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
//                 >
//                   Create
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <div className="grid gap-4">
//         {classes.map((cls) => (
//           <div
//             key={cls.id}
//             className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
//           >
//             <div>
//               <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
//               <p className="text-gray-500">{cls.description}</p>
//             </div>
//             <div className="flex justify-between items-center mt-4">
//               <button
//                 onClick={() => navigate(`/teacher/classes/${cls.id}`)}
//                 className="text-purple-600 hover:text-purple-800"
//               >
//                 View Questions
//               </button>
//               <div className="flex items-center gap-4">
//                 <p className="text-gray-500">Class Code: {cls.join_code}</p>
//                 <button
//                   onClick={() => handleDeleteClass(cls.id)}
//                   className="text-red-600 hover:text-red-800"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function ClassQuestions() {
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [newQuestion, setNewQuestion] = useState({
//     question: "",
//     options: ["", "", "", ""],
//     correct_answer: "",
//     difficulty: "medium" as "easy" | "medium" | "hard",
//   });
//   const { classId } = useParams();
//   const user = useAuthStore((state) => state.user);

//   useEffect(() => {
//     if (classId) {
//       loadQuestions();
//     }
//   }, [classId]);

//   const loadQuestions = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("questions")
//         .select("*")
//         .eq("class_id", classId)
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       if (data) {
//         setQuestions(data);
//       }
//     } catch (err) {
//       console.error("Error loading questions:", err);
//     }
//   };
//   //   e.preventDefault();
//   //   if (!user || !classId) return;

//   //   try {
//   //     const { error } = await supabase.from("questions").insert([
//   //       {
//   //         ...newQuestion,
//   //         class_id: classId,
//   //         created_by: user.id,
//   //       },
//   //     ]);

//   //     if (error) throw error;

//   //     setShowCreateForm(false);
//   //     setNewQuestion({
//   //       question: "",
//   //       options: ["", "", "", ""],
//   //       correct_answer: "",
//   //       difficulty: "medium",
//   //     });
//   //     loadQuestions();
//   //   } catch (err) {
//   //     console.error("Error creating question:", err);
//   //   }
//   // };

// const handleCreateQuestion = async (e: React.FormEvent) => {
//   e.preventDefault();
//   if (!user || !classId) return;

//   try {
//     // Fetch the class details to get the 'name' which we'll use as the category.
//     const { data: classData, error: classError } = await supabase
//       .from("classes")
//       .select("name")
//       .eq("id", classId)
//       .single();

//     if (classError || !classData) {
//       throw new Error("Failed to fetch class details for category");
//     }

//     const categoryForQuestion = classData.name; // The value from the 'name' column

//     // Insert the new question with the category set to the class name
//     const { error } = await supabase.from("questions").insert([
//       {
//         ...newQuestion,
//         category: categoryForQuestion, // This value will now be stored in the 'category' column
//         class_id: classId,
//         created_by: user.id,
//       },
//     ]);

//     if (error) throw error;

//     setShowCreateForm(false);
//     setNewQuestion({
//       question: "",
//       options: ["", "", "", ""],
//       correct_answer: "",
//       difficulty: "medium",
//     });
//     loadQuestions();
//   } catch (err) {
//     console.error("Error creating question:", err);
//   }
// };


//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
//         <button
//           onClick={() => setShowCreateForm(true)}
//           className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
//         >
//           <Plus className="w-5 h-5" />
//           Add Question
//         </button>
//       </div>

//       {showCreateForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
//             <h3 className="text-xl font-bold mb-4">Create New Question</h3>
//             <form onSubmit={handleCreateQuestion}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question
//                 </label>
//                 <textarea
//                   value={newQuestion.question}
//                   onChange={(e) =>
//                     setNewQuestion({ ...newQuestion, question: e.target.value })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   rows={3}
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Options
//                 </label>
//                 {newQuestion.options.map((option, index) => (
//                   <div key={index} className="mb-2">
//                     <input
//                       type="text"
//                       value={option}
//                       onChange={(e) => {
//                         const newOptions = [...newQuestion.options];
//                         newOptions[index] = e.target.value;
//                         setNewQuestion({ ...newQuestion, options: newOptions });
//                       }}
//                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                       placeholder={`Option ${index + 1}`}
//                       required
//                     />
//                   </div>
//                 ))}
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Correct Answer
//                 </label>
//                 <select
//                   value={newQuestion.correct_answer}
//                   onChange={(e) =>
//                     setNewQuestion({
//                       ...newQuestion,
//                       correct_answer: e.target.value,
//                     })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   required
//                 >
//                   <option value="">Select correct answer</option>
//                   {newQuestion.options.map((option, index) => (
//                     <option key={index} value={option}>
//                       {option || `Option ${index + 1}`}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Difficulty
//                 </label>
//                 <select
//                   value={newQuestion.difficulty}
//                   onChange={(e) =>
//                     setNewQuestion({
//                       ...newQuestion,
//                       difficulty: e.target.value as "easy" | "medium" | "hard",
//                     })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 >
//                   <option value="easy">Easy</option>
//                   <option value="medium">Medium</option>
//                   <option value="hard">Hard</option>
//                 </select>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateForm(false)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
//                 >
//                   Create
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <div className="grid gap-4">
//         {questions.map((question) => (
//           <div key={question.id} className="bg-white p-4 rounded-lg shadow">
//             <div className="flex justify-between items-start">
//               <h3 className="text-lg font-medium text-gray-900">
//                 {question.question}
//               </h3>
//               <span
//                 className={`px-2 py-1 rounded text-sm ${
//                   question.difficulty === "easy"
//                     ? "bg-green-100 text-green-800"
//                     : question.difficulty === "medium"
//                     ? "bg-yellow-100 text-yellow-800"
//                     : "bg-red-100 text-red-800"
//                 }`}
//               >
//                 {question.difficulty}
//               </span>
//             </div>
//             <div className="mt-4 space-y-2">
//               {question.options.map((option, index) => (
//                 <div
//                   key={index}
//                   className={`p-2 rounded ${
//                     option === question.correct_answer
//                       ? "bg-green-100 text-green-800"
//                       : "bg-gray-50"
//                   }`}
//                 >
//                   {option}
//                   {option === question.correct_answer && " (Correct)"}
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setClasses(data);
      }
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Generate an 8-character unique join code
      const joinCode = nanoid(8);

      const { error } = await supabase.from("classes").insert([
        {
          name: newClassName.trim(),
          description: newClassDescription.trim(),
          created_by: user.id,
          join_code: joinCode,
        },
      ]);

      if (error) throw error;

      setNewClassName("");
      setNewClassDescription("");
      setShowCreateForm(false);
      loadClasses();
    } catch (err) {
      console.error("Error creating class:", err);
    }
  };

  // New function to delete a class
  const handleDeleteClass = async (id: string) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this class?")) return;

    try {
      // Delete only if the current user is the creator
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id)
        .eq("created_by", user.id);

      if (error) throw error;
      // Update the local state to remove the deleted class
      setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== id));
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  // Optionally, if you still want to fetch subjects (or class names) to fill a dropdown,
  // you could do that in a separate useEffect.

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
              <p className="text-gray-500">{cls.description}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                className="text-purple-600 hover:text-purple-800"
              >
                View Questions
              </button>
              <div className="flex items-center gap-4">
                <p className="text-gray-500">Class Code: {cls.join_code}</p>
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { classId } = useParams<{ classId: string }>();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (classId) {
      loadQuestions();
    }
  }, [classId]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setQuestions(data);
      }
    } catch (err) {
      console.error("Error loading questions:", err);
    }
  };

  // Function to create a new question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classId) return;

    try {
      // Fetch the class details to get the 'name' which we'll use as the category.
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classError || !classData) {
        throw new Error("Failed to fetch class details for category");
      }

      const categoryForQuestion = classData.name; // using class name as category

      const { error } = await supabase.from("questions").insert([
        {
          ...newQuestion,
          category: categoryForQuestion,
          class_id: classId,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      setShowCreateForm(false);
      setNewQuestion({
        question: "",
        options: ["", "", "", ""],
        correct_answer: "",
        difficulty: "medium",
      });
      loadQuestions();
    } catch (err) {
      console.error("Error creating question:", err);
    }
  };

  // New function to delete a question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId)
        .eq("created_by", user.id);
      if (error) throw error;
      // Remove the deleted question from the local state
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  // New function to update a question
  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingQuestion) return;
    try {
      const { error } = await supabase
        .from("questions")
        .update({
          question: editingQuestion.question.trim(),
          options: editingQuestion.options.map((opt) => opt.trim()),
          correct_answer: editingQuestion.correct_answer.trim(),
          difficulty: editingQuestion.difficulty,
        })
        .eq("id", editingQuestion.id)
        .eq("created_by", user.id);
      if (error) throw error;
      setEditingQuestion(null);
      setShowEditForm(false);
      loadQuestions();
    } catch (err) {
      console.error("Error updating question:", err);
    }
  };

  // Function to handle field changes in edit form
  const handleEditFieldChange = (
    field: keyof Question,
    value: string | string[] | "easy" | "medium" | "hard"
  ) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      [field]: value,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Create Question Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Create New Question</h3>
            <form onSubmit={handleCreateQuestion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Correct Answer
                </label>
                <select
                  value={newQuestion.correct_answer}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      correct_answer: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                >
                  <option value="">Select correct answer</option>
                  {newQuestion.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option || `Option ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      difficulty: e.target.value as "easy" | "medium" | "hard",
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditForm && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Question</h3>
            <form onSubmit={handleUpdateQuestion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  value={editingQuestion.question}
                  onChange={(e) =>
                    handleEditFieldChange("question", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[index] = e.target.value;
                        handleEditFieldChange("options", newOptions);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Correct Answer
                </label>
                <select
                  value={editingQuestion.correct_answer}
                  onChange={(e) =>
                    handleEditFieldChange("correct_answer", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                >
                  <option value="">Select correct answer</option>
                  {editingQuestion.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option || `Option ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    handleEditFieldChange("difficulty", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">
                {question.question}
              </h3>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  question.difficulty === "easy"
                    ? "bg-green-100 text-green-800"
                    : question.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {question.difficulty}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    option === question.correct_answer
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-50"
                  }`}
                >
                  {option}
                  {option === question.correct_answer && " (Correct)"}
                </div>
              ))}
            </div>
            <div className="flex justify-end items-center gap-4 mt-4">
              <button
                onClick={() => {
                  // Open edit modal with current question pre-filled
                  setEditingQuestion(question);
                  setShowEditForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [timeLimit, setTimeLimit] = useState(30);
  const [numQuestions, setNumQuestions] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!title.trim()) throw new Error("Title is required");
      if (timeLimit < 1 || timeLimit > 180)
        throw new Error("Time limit must be between 1 and 180 minutes");
      if (numQuestions < 1)
        throw new Error("Must include at least one question");
      if (!category) throw new Error("Category selection is important");

      setCategory(category);
      const { data: questions, error: questionError } = await supabase
        .from("questions")
        .select("id")
        .eq("difficulty", difficulty)
        .eq("category", category);
      if (questionError) throw new Error("Failed to fetch questions");
      if (!questions || questions.length < numQuestions) {
        throw new Error(
          "Not enough questions available for the selected criteria"
        );
      }
      const questionIds = questions.map((q) => q.id);
      const { error: quizError } = await supabase.from("quizzes").insert([
        {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          time_limit: timeLimit,
          questions: questionIds,
          created_by: user?.id,
          category: category, // Include the selected category here
        },
      ]);

      if (quizError) {
        console.error("Quiz creation error:", quizError);
        throw new Error("Failed to create quiz");
      }

      navigate("/teacher/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     const { data, error } = await supabase
  //       .from("questions")
  //       .select("category", { distinct: true }); // Fetch unique categories

  //     if (error) {
  //       console.error("Error fetching categories:", error);
  //     } else {
  //       const uniqueCategories = [...new Set(data.map((q) => q.category))]; // Ensure uniqueness
  //       setCategories(uniqueCategories);
  //     }
  //   };

  //   fetchCategories();
  // }, []);
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from("classes").select("name");

      if (error) {
        console.error("Error fetching class titles:", error);
      } else if (data) {
        // Map through the fetched data to extract class titles
        const classTitles = data.map((cls) => cls.name);
        setCategories(classTitles); // You can rename setCategories to setSubjects if preferred
      }
    };

    fetchSubjects();
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
            <option value="">Select a subject</option>
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
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

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
          <Route
            path="/"
            element={<Navigate to="/teacher/classes" replace />}
          />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassQuestions />} />
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quizzes/create" element={<CreateQuiz />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </div>
    </div>
  );
}
