import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {GraduationCap,Book,LogOut,Plus,List,BarChart,Users,Award,User} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { FaChalkboard } from "react-icons/fa";
import { PlusCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { Edit, Trash2 } from "react-feather";
import { Button, Input, Card, CardContent } from "@/components/ui";

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

// function ClassQuestions() {
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);

//   // Updated newQuestion state to include marks (as a string so we can use an input)
//   const [newQuestion, setNewQuestion] = useState({
//     question: "",
//     options: ["", "", "", ""],
//     correct_answer: [] as string[],
//     difficulty: "medium" as "easy" | "medium" | "hard",
//     questionType: "single" as "single" | "multiple",
//     marks: "", // New field for marks allotment
//   });

//   // Update editingQuestion state type if needed.
//   const [editingQuestion, setEditingQuestion] = useState<
//     | (Question & {
//         questionType: "single" | "multiple";
//         correct_answer: string[];
//         marks: number;
//       })
//     | null
//   >(null);

//   const { classId } = useParams<{ classId: string }>();
//   const user = useAuthStore((state) => state.user);
//   const navigate = useNavigate();

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

//   // Function to create a new question (now including marks)
//   const handleCreateQuestion = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !classId) return;

//     // Validate that all fields are provided
//     if (
//       !newQuestion.question.trim() ||
//       newQuestion.options.some((opt) => !opt.trim()) ||
//       !newQuestion.marks ||
//       (newQuestion.questionType === "single" &&
//         (!newQuestion.correct_answer[0] ||
//           !newQuestion.correct_answer[0].trim())) ||
//       (newQuestion.questionType === "multiple" &&
//         newQuestion.correct_answer.length === 0)
//     ) {
//       alert(
//         "Please fill in all fields and select at least one correct answer."
//       );
//       return;
//     }

//     try {
//       // Fetch the class details to get the 'name' which we'll use as the category.
//       const { data: classData, error: classError } = await supabase
//         .from("classes")
//         .select("name")
//         .eq("id", classId)
//         .single();

//       if (classError || !classData) {
//         throw new Error("Failed to fetch class details for category");
//       }

//       const categoryForQuestion = classData.name; // using class name as category

//       // Insert question into the database; convert marks to a number.
//       const { error } = await supabase.from("questions").insert([
//         {
//           ...newQuestion,
//           category: categoryForQuestion,
//           class_id: classId,
//           created_by: user.id,
//           marks: parseInt(newQuestion.marks, 10), // include marks allotment
//         },
//       ]);

//       if (error) throw error;

//       // Reset form and close modal
//       setShowCreateForm(false);
//       setNewQuestion({
//         question: "",
//         options: ["", "", "", ""],
//         correct_answer: [],
//         difficulty: "medium",
//         questionType: "single",
//         marks: "",
//       });
//       loadQuestions();
//     } catch (err) {
//       console.error("Error creating question:", err);
//     }
//   };

//   // Function to delete a question
//   const handleDeleteQuestion = async (questionId: string) => {
//     if (!window.confirm("Are you sure you want to delete this question?"))
//       return;
//     try {
//       const { error } = await supabase
//         .from("questions")
//         .delete()
//         .eq("id", questionId)
//         .eq("created_by", user.id);
//       if (error) throw error;
//       setQuestions((prev) => prev.filter((q) => q.id !== questionId));
//     } catch (err) {
//       console.error("Error deleting question:", err);
//     }
//   };

//   // Function to update a question
//   const handleUpdateQuestion = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !editingQuestion) return;
//     try {
//       const { error } = await supabase
//         .from("questions")
//         .update({
//           question: editingQuestion.question.trim(),
//           options: editingQuestion.options.map((opt) => opt.trim()),
//           correct_answer: editingQuestion.correct_answer,
//           difficulty: editingQuestion.difficulty,
//           questionType: editingQuestion.questionType,
//           marks: editingQuestion.marks, // update marks as well
//         })
//         .eq("id", editingQuestion.id)
//         .eq("created_by", user.id);
//       if (error) throw error;
//       setEditingQuestion(null);
//       setShowEditForm(false);
//       loadQuestions();
//     } catch (err) {
//       console.error("Error updating question:", err);
//     }
//   };

//   // Function to handle field changes in the edit form
//   const handleEditFieldChange = (
//     field: keyof Question,
//     value:
//       | string
//       | string[]
//       | "easy"
//       | "medium"
//       | "hard"
//       | "single"
//       | "multiple"
//   ) => {
//     if (!editingQuestion) return;
//     setEditingQuestion({
//       ...editingQuestion,
//       [field]: value,
//     });
//   };

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

//       {/* Create Question Modal */}
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

//               {/* New: Choose Question Type */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question Type
//                 </label>
//                 <select
//                   value={newQuestion.questionType}
//                   onChange={(e) =>
//                     setNewQuestion({
//                       ...newQuestion,
//                       questionType: e.target.value as "single" | "multiple",
//                       correct_answer: [],
//                     })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 >
//                   <option value="single">Single Correct Answer</option>
//                   <option value="multiple">Multiple Correct Answers</option>
//                 </select>
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
//                         const oldOption = newOptions[index];
//                         const updatedOption = e.target.value;
//                         newOptions[index] = updatedOption;
//                         // Replace the old option with the updated value if it was selected as correct
//                         const newCorrect = newQuestion.correct_answer.map(
//                           (ans) => (ans === oldOption ? updatedOption : ans)
//                         );
//                         setNewQuestion({
//                           ...newQuestion,
//                           options: newOptions,
//                           correct_answer: newCorrect,
//                         });
//                       }}
//                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                       placeholder={`Option ${index + 1}`}
//                       required
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Conditional Correct Answer Section */}
//               {newQuestion.questionType === "single" ? (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answer
//                   </label>
//                   <select
//                     value={newQuestion.correct_answer[0] || ""}
//                     onChange={(e) =>
//                       setNewQuestion({
//                         ...newQuestion,
//                         correct_answer: [e.target.value],
//                       })
//                     }
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                     required
//                   >
//                     <option value="">Select correct answer</option>
//                     {newQuestion.options.map((option, index) => (
//                       <option key={index} value={option}>
//                         {option || `Option ${index + 1}`}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answers
//                   </label>
//                   {newQuestion.options.map((option, index) => (
//                     <div key={index} className="flex items-center gap-2 mb-2">
//                       <input
//                         type="checkbox"
//                         checked={newQuestion.correct_answer.includes(option)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             setNewQuestion((prev) => ({
//                               ...prev,
//                               correct_answer: [...prev.correct_answer, option],
//                             }));
//                           } else {
//                             setNewQuestion((prev) => ({
//                               ...prev,
//                               correct_answer: prev.correct_answer.filter(
//                                 (ans) => ans !== option
//                               ),
//                             }));
//                           }
//                         }}
//                       />
//                       <span>{option || `Option ${index + 1}`}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* New: Marks allotment input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Marks
//                 </label>
//                 <input
//                   type="number"
//                   value={newQuestion.marks}
//                   onChange={(e) =>
//                     setNewQuestion({ ...newQuestion, marks: e.target.value })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   placeholder="Enter marks for this question"
//                   required
//                 />
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

//       {/* Edit Question Modal (with similar marks allotment functionality) */}
//       {showEditForm && editingQuestion && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
//             <h3 className="text-xl font-bold mb-4">Edit Question</h3>
//             <form onSubmit={handleUpdateQuestion}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question
//                 </label>
//                 <textarea
//                   value={editingQuestion.question}
//                   onChange={(e) =>
//                     handleEditFieldChange("question", e.target.value)
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   rows={3}
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question Type
//                 </label>
//                 <select
//                   value={editingQuestion.questionType}
//                   onChange={(e) =>
//                     handleEditFieldChange(
//                       "questionType",
//                       e.target.value as "single" | "multiple"
//                     )
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 >
//                   <option value="single">Single Correct Answer</option>
//                   <option value="multiple">Multiple Correct Answers</option>
//                 </select>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Options
//                 </label>
//                 {editingQuestion.options.map((option, index) => (
//                   <div key={index} className="mb-2">
//                     <input
//                       type="text"
//                       value={option}
//                       onChange={(e) => {
//                         const newOptions = [...editingQuestion.options];
//                         newOptions[index] = e.target.value;
//                         handleEditFieldChange("options", newOptions);
//                       }}
//                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                       placeholder={`Option ${index + 1}`}
//                       required
//                     />
//                   </div>
//                 ))}
//               </div>

//               {editingQuestion.questionType === "single" ? (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answer
//                   </label>
//                   <select
//                     value={editingQuestion.correct_answer[0] || ""}
//                     onChange={(e) =>
//                       handleEditFieldChange("correct_answer", [e.target.value])
//                     }
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                     required
//                   >
//                     <option value="">Select correct answer</option>
//                     {editingQuestion.options.map((option, index) => (
//                       <option key={index} value={option}>
//                         {option || `Option ${index + 1}`}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answers
//                   </label>
//                   {editingQuestion.options.map((option, index) => (
//                     <div key={index} className="flex items-center gap-2 mb-2">
//                       <input
//                         type="checkbox"
//                         checked={editingQuestion.correct_answer.includes(
//                           option
//                         )}
//                         onChange={() => {
//                           const alreadySelected =
//                             editingQuestion.correct_answer.includes(option);
//                           const newCorrectAnswers = alreadySelected
//                             ? editingQuestion.correct_answer.filter(
//                                 (ans) => ans !== option
//                               )
//                             : [...editingQuestion.correct_answer, option];
//                           handleEditFieldChange(
//                             "correct_answer",
//                             newCorrectAnswers
//                           );
//                         }}
//                       />
//                       <span>{option || `Option ${index + 1}`}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Marks allotment input for editing */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Marks
//                 </label>
//                 <input
//                   type="number"
//                   value={editingQuestion.marks}
//                   onChange={(e) =>
//                     handleEditFieldChange("marks", parseInt(e.target.value, 10))
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Difficulty
//                 </label>
//                 <select
//                   value={editingQuestion.difficulty}
//                   onChange={(e) =>
//                     handleEditFieldChange(
//                       "difficulty",
//                       e.target.value as "easy" | "medium" | "hard"
//                     )
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
//                   onClick={() => {
//                     setShowEditForm(false);
//                     setEditingQuestion(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
//                 >
//                   Update
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Display Questions */}
//       <div className="grid gap-4">
//         {questions.map((question) => (
//           <div
//             key={question.id}
//             className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
//           >
//             <div className="flex justify-between items-start">
//               <h3 className="text-lg font-medium text-gray-900">
//                 {question.question}
//               </h3>
//               <div className="flex gap-2">
//                 <span
//                   className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
//                     question.difficulty === "easy"
//                       ? "bg-green-100 text-green-800"
//                       : question.difficulty === "medium"
//                       ? "bg-yellow-100 text-yellow-800"
//                       : "bg-red-100 text-red-800"
//                   }`}
//                 >
//                   {question.difficulty}
//                 </span>
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
//                   {question.marks} Marks
//                 </span>
//               </div>
//             </div>
//             <div className="mt-4 space-y-2">
//               {question.options.map((option, index) => {
//                 let isCorrect = false;

//                 if (question.questionType === "multiple") {
//                   // For multiple-answer questions, correct_answer is assumed to be an array.
//                   isCorrect = question.correct_answer.includes(option);
//                 } else if (question.questionType === "single") {
//                   // Extract the correct answer regardless of whether it's an array or a string.
//                   const correctAnswer = Array.isArray(question.correct_answer)
//                     ? question.correct_answer[0]
//                     : question.correct_answer;
//                   // Compare the normalized values (trimmed and lowercased) to avoid mismatches.
//                   isCorrect =
//                     option.trim().toLowerCase() ===
//                     correctAnswer.trim().toLowerCase();
//                 }

//                 return (
//                   <div
//                     key={index}
//                     className={`p-2 rounded flex justify-between items-center ${
//                       isCorrect
//                         ? "bg-green-100 text-green-800"
//                         : "bg-gray-50 text-gray-900"
//                     }`}
//                   >
//                     <span>{option}</span>
//                     {isCorrect && (
//                       <span className="ml-2 text-xs font-semibold text-green-600 uppercase tracking-wide">
//                         Correct
//                       </span>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* <div className="mt-4 space-y-2">
//               {question.options.map((option, index) => {
//                 let isCorrect = false;

//                 if (question.questionType === "multiple") {
//                   // For multiple-answer questions, correct_answer is assumed to be an array.
//                   isCorrect = question.correct_answer.includes(option);
//                 }
//                 else if (question.questionType === "single") {
//                   // Check if correct_answer is an array; if not, compare directly.
//                   if (Array.isArray(question.correct_answer)) {
//                     isCorrect =
//                       option.trim().toLowerCase() ===
//                       question.correct_answer[0].trim().toLowerCase();
//                   } else {
//                     isCorrect =
//                       option.trim().toLowerCase() ===
//                       question.correct_answer.trim().toLowerCase();
//                   }
//                 }
//                 return (
//                   <div
//                     key={index}
//                     className={`p-2 rounded flex justify-between items-center ${
//                       isCorrect
//                         ? "bg-green-100 text-green-800"
//                         : "bg-gray-50 text-gray-900"
//                     }`}
//                   >
//                     <span>{option}</span>
//                     {isCorrect && (
//                       <span className="ml-2 text-xs font-semibold text-green-600 uppercase tracking-wide">
//                         Correct
//                       </span>
//                     )}
//                   </div>
//                 );
//               })}
//             </div> */}

//             <div className="flex justify-end items-center gap-4 mt-4">
//               <button
//                 onClick={() => {
//                   setEditingQuestion(question);
//                   setShowEditForm(true);
//                 }}
//                 className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
//               >
//                 <Edit className="w-4 h-4" />
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDeleteQuestion(question.id)}
//                 className="text-red-600 hover:text-red-800 flex items-center gap-1"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete
//               </button>
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
//   const [showEditForm, setShowEditForm] = useState(false);

//   // Updated newQuestion state to include marks (as a string so we can use an input)
//   const [newQuestion, setNewQuestion] = useState({
//     question: "",
//     options: ["", "", "", ""],
//     correct_answer: [] as string[],
//     difficulty: "medium" as "easy" | "medium" | "hard",
//     questionType: "single" as "single" | "multiple",
//     marks: "", // New field for marks allotment
//   });

//   // Update editingQuestion state type if needed.
//   const [editingQuestion, setEditingQuestion] = useState<
//     | (Question & {
//         questionType: "single" | "multiple";
//         correct_answer: string[];
//         marks: number;
//       })
//     | null
//   >(null);

//   const { classId } = useParams<{ classId: string }>();
//   const user = useAuthStore((state) => state.user);
//   const navigate = useNavigate();

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

//   // Function to create a new question (now including marks)
//   const handleCreateQuestion = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !classId) return;

//     // Validate that all fields are provided
//     if (
//       !newQuestion.question.trim() ||
//       newQuestion.options.some((opt) => !opt.trim()) ||
//       !newQuestion.marks ||
//       (newQuestion.questionType === "single" &&
//         (!newQuestion.correct_answer[0] ||
//           !newQuestion.correct_answer[0].trim())) ||
//       (newQuestion.questionType === "multiple" &&
//         newQuestion.correct_answer.length === 0)
//     ) {
//       alert(
//         "Please fill in all fields and select at least one correct answer."
//       );
//       return;
//     }

//     try {
//       // Fetch the class details to get the 'name' which we'll use as the category.
//       const { data: classData, error: classError } = await supabase
//         .from("classes")
//         .select("name")
//         .eq("id", classId)
//         .single();

//       if (classError || !classData) {
//         throw new Error("Failed to fetch class details for category");
//       }

//       const categoryForQuestion = classData.name; // using class name as category

//       // Insert question into the database; convert marks to a number.
//       const { error } = await supabase.from("questions").insert([
//         {
//           ...newQuestion,
//           category: categoryForQuestion,
//           class_id: classId,
//           created_by: user.id,
//           marks: parseInt(newQuestion.marks, 10), // include marks allotment
//         },
//       ]);

//       if (error) throw error;

//       // Reset form and close modal
//       setShowCreateForm(false);
//       setNewQuestion({
//         question: "",
//         options: ["", "", "", ""],
//         correct_answer: [],
//         difficulty: "medium",
//         questionType: "single",
//         marks: "",
//       });
//       loadQuestions();
//     } catch (err) {
//       console.error("Error creating question:", err);
//     }
//   };

//   // Function to delete a question
//   const handleDeleteQuestion = async (questionId: string) => {
//     if (!window.confirm("Are you sure you want to delete this question?"))
//       return;
//     try {
//       const { error } = await supabase
//         .from("questions")
//         .delete()
//         .eq("id", questionId)
//         .eq("created_by", user.id);
//       if (error) throw error;
//       setQuestions((prev) => prev.filter((q) => q.id !== questionId));
//     } catch (err) {
//       console.error("Error deleting question:", err);
//     }
//   };

//   // Function to update a question
//   const handleUpdateQuestion = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !editingQuestion) return;
//     try {
//       const { error } = await supabase
//         .from("questions")
//         .update({
//           question: editingQuestion.question.trim(),
//           options: editingQuestion.options.map((opt) => opt.trim()),
//           correct_answer: editingQuestion.correct_answer,
//           difficulty: editingQuestion.difficulty,
//           questionType: editingQuestion.questionType,
//           marks: editingQuestion.marks, // update marks as well
//         })
//         .eq("id", editingQuestion.id)
//         .eq("created_by", user.id);
//       if (error) throw error;
//       setEditingQuestion(null);
//       setShowEditForm(false);
//       loadQuestions();
//     } catch (err) {
//       console.error("Error updating question:", err);
//     }
//   };

//   // Function to handle field changes in the edit form
//   const handleEditFieldChange = (
//     field: keyof Question,
//     value:
//       | string
//       | string[]
//       | "easy"
//       | "medium"
//       | "hard"
//       | "single"
//       | "multiple"
//   ) => {
//     if (!editingQuestion) return;
//     setEditingQuestion({
//       ...editingQuestion,
//       [field]: value,
//     });
//   };

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

//       {/* Create Question Modal */}
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

//               {/* New: Choose Question Type */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question Type
//                 </label>
//                 <select
//                   value={newQuestion.questionType}
//                   onChange={(e) =>
//                     setNewQuestion({
//                       ...newQuestion,
//                       questionType: e.target.value as "single" | "multiple",
//                       correct_answer: [],
//                     })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 >
//                   <option value="single">Single Correct Answer</option>
//                   <option value="multiple">Multiple Correct Answers</option>
//                 </select>
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
//                         const oldOption = newOptions[index];
//                         const updatedOption = e.target.value;
//                         newOptions[index] = updatedOption;
//                         // Replace the old option with the updated value if it was selected as correct
//                         const newCorrect = newQuestion.correct_answer.map(
//                           (ans) => (ans === oldOption ? updatedOption : ans)
//                         );
//                         setNewQuestion({
//                           ...newQuestion,
//                           options: newOptions,
//                           correct_answer: newCorrect,
//                         });
//                       }}
//                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                       placeholder={`Option ${index + 1}`}
//                       required
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Conditional Correct Answer Section */}
//               {newQuestion.questionType === "single" ? (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answer
//                   </label>
//                   <select
//                     value={newQuestion.correct_answer[0] || ""}
//                     onChange={(e) =>
//                       setNewQuestion({
//                         ...newQuestion,
//                         correct_answer: [e.target.value],
//                       })
//                     }
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                     required
//                   >
//                     <option value="">Select correct answer</option>
//                     {newQuestion.options.map((option, index) => (
//                       <option key={index} value={option}>
//                         {option || `Option ${index + 1}`}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answers
//                   </label>
//                   {newQuestion.options.map((option, index) => (
//                     <div key={index} className="flex items-center gap-2 mb-2">
//                       <input
//                         type="checkbox"
//                         checked={newQuestion.correct_answer.includes(option)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             setNewQuestion((prev) => ({
//                               ...prev,
//                               correct_answer: [...prev.correct_answer, option],
//                             }));
//                           } else {
//                             setNewQuestion((prev) => ({
//                               ...prev,
//                               correct_answer: prev.correct_answer.filter(
//                                 (ans) => ans !== option
//                               ),
//                             }));
//                           }
//                         }}
//                       />
//                       <span>{option || `Option ${index + 1}`}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* New: Marks allotment input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Marks
//                 </label>
//                 <input
//                   type="number"
//                   value={newQuestion.marks}
//                   onChange={(e) =>
//                     setNewQuestion({ ...newQuestion, marks: e.target.value })
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   placeholder="Enter marks for this question"
//                   required
//                 />
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

//       {/* Edit Question Modal */}
//       {showEditForm && editingQuestion && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
//             <h3 className="text-xl font-bold mb-4">Edit Question</h3>
//             <form onSubmit={handleUpdateQuestion}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question
//                 </label>
//                 <textarea
//                   value={editingQuestion.question}
//                   onChange={(e) =>
//                     handleEditFieldChange("question", e.target.value)
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   rows={3}
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Question Type
//                 </label>
//                 <select
//                   value={editingQuestion.questionType}
//                   onChange={(e) =>
//                     handleEditFieldChange(
//                       "questionType",
//                       e.target.value as "single" | "multiple"
//                     )
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 >
//                   <option value="single">Single Correct Answer</option>
//                   <option value="multiple">Multiple Correct Answers</option>
//                 </select>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Options
//                 </label>
//                 {editingQuestion.options.map((option, index) => (
//                   <div key={index} className="mb-2">
//                     <input
//                       type="text"
//                       value={option}
//                       onChange={(e) => {
//                         const newOptions = [...editingQuestion.options];
//                         newOptions[index] = e.target.value;
//                         handleEditFieldChange("options", newOptions);
//                       }}
//                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                       placeholder={`Option ${index + 1}`}
//                       required
//                     />
//                   </div>
//                 ))}
//               </div>

//               {editingQuestion.questionType === "single" ? (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answer
//                   </label>
//                   <select
//                     value={editingQuestion.correct_answer[0] || ""}
//                     onChange={(e) =>
//                       handleEditFieldChange("correct_answer", [e.target.value])
//                     }
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                     required
//                   >
//                     <option value="">Select correct answer</option>
//                     {editingQuestion.options.map((option, index) => (
//                       <option key={index} value={option}>
//                         {option || `Option ${index + 1}`}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Correct Answers
//                   </label>
//                   {editingQuestion.options.map((option, index) => (
//                     <div key={index} className="flex items-center gap-2 mb-2">
//                       <input
//                         type="checkbox"
//                         checked={editingQuestion.correct_answer.includes(
//                           option
//                         )}
//                         onChange={() => {
//                           const alreadySelected =
//                             editingQuestion.correct_answer.includes(option);
//                           const newCorrectAnswers = alreadySelected
//                             ? editingQuestion.correct_answer.filter(
//                                 (ans) => ans !== option
//                               )
//                             : [...editingQuestion.correct_answer, option];
//                           handleEditFieldChange(
//                             "correct_answer",
//                             newCorrectAnswers
//                           );
//                         }}
//                       />
//                       <span>{option || `Option ${index + 1}`}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Marks
//                 </label>
//                 <input
//                   type="number"
//                   value={editingQuestion.marks}
//                   onChange={(e) =>
//                     handleEditFieldChange("marks", parseInt(e.target.value, 10))
//                   }
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Difficulty
//                 </label>
//                 <select
//                   value={editingQuestion.difficulty}
//                   onChange={(e) =>
//                     handleEditFieldChange(
//                       "difficulty",
//                       e.target.value as "easy" | "medium" | "hard"
//                     )
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
//                   onClick={() => {
//                     setShowEditForm(false);
//                     setEditingQuestion(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
//                 >
//                   Update
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Display Questions */}
//       <div className="grid gap-4">
//         {questions.map((question) => (
//           <div
//             key={question.id}
//             className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
//           >
//             <div className="flex justify-between items-start">
//               <h3 className="text-lg font-medium text-gray-900">
//                 {question.question}
//               </h3>
//               <div className="flex gap-2">
//                 <span
//                   className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
//                     question.difficulty === "easy"
//                       ? "bg-green-100 text-green-800"
//                       : question.difficulty === "medium"
//                       ? "bg-yellow-100 text-yellow-800"
//                       : "bg-red-100 text-red-800"
//                   }`}
//                 >
//                   {question.difficulty}
//                 </span>
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
//                   {question.marks} Marks
//                 </span>
//               </div>
//             </div>
//             <div className="mt-4 space-y-2">
//               {question.options.map((option, index) => {
//                 // Convert the correct_answer to an array.
//                 // If it's a string that looks like a JSON array, try to parse it.
//                 let correctAnswers: string[];
//                 if (typeof question.correct_answer === "string") {
//                   try {
//                     const parsed = JSON.parse(question.correct_answer);
//                     correctAnswers = Array.isArray(parsed)
//                       ? parsed
//                       : [question.correct_answer];
//                   } catch (e) {
//                     correctAnswers = [question.correct_answer];
//                   }
//                 } else {
//                   correctAnswers = question.correct_answer;
//                 }

//                 // Normalize and check if the option matches any of the correct answers.
//                 const isCorrect = correctAnswers.some(
//                   (answer) =>
//                     answer.trim().toLowerCase() === option.trim().toLowerCase()
//                 );
//                 return (
//                   <div
//                     key={index}
//                     className={`p-2 rounded flex justify-between items-center ${
//                       isCorrect
//                         ? "bg-green-100 text-green-800"
//                         : "bg-gray-50 text-gray-900"
//                     }`}
//                   >
//                     <span>{option}</span>
//                     {isCorrect && (
//                       <span className="ml-2 text-xs font-semibold text-green-600 uppercase tracking-wide">
//                         Correct
//                       </span>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//             <div className="flex justify-end items-center gap-4 mt-4">
//               <button
//                 onClick={() => {
//                   setEditingQuestion(question);
//                   setShowEditForm(true);
//                 }}
//                 className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
//               >
//                 <Edit className="w-4 h-4" />
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDeleteQuestion(question.id)}
//                 className="text-red-600 hover:text-red-800 flex items-center gap-1"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

/*************************************
  ClassQuestions.tsx (updated)
*************************************/

function ClassQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Updated newQuestion state to include marks (as a string so we can use an input)
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: [] as string[],
    difficulty: "medium" as "easy" | "medium" | "hard",
    questionType: "single" as "single" | "multiple",
    marks: "", // New field for marks allotment
  });

  // Update editingQuestion state type if needed.
  const [editingQuestion, setEditingQuestion] = useState<
    | (Question & {
        questionType: "single" | "multiple";
        correct_answer: string[];
        marks: number;
      })
    | null
  >(null);

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

  // Function to create a new question (including marks)
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classId) return;

    // Validate that all fields are provided
    if (
      !newQuestion.question.trim() ||
      newQuestion.options.some((opt) => !opt.trim()) ||
      !newQuestion.marks ||
      (newQuestion.questionType === "single" &&
        (!newQuestion.correct_answer[0] ||
          !newQuestion.correct_answer[0].trim())) ||
      (newQuestion.questionType === "multiple" &&
        newQuestion.correct_answer.length === 0)
    ) {
      alert("Please fill in all fields and select at least one correct answer.");
      return;
    }

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

      // Insert question into the database; convert marks to a number.
      const { error } = await supabase.from("questions").insert([
        {
          ...newQuestion,
          category: categoryForQuestion,
          class_id: classId,
          created_by: user.id,
          marks: parseInt(newQuestion.marks, 10), // include marks allotment
        },
      ]);

      if (error) throw error;

      // Reset form and close modal
      setShowCreateForm(false);
      setNewQuestion({
        question: "",
        options: ["", "", "", ""],
        correct_answer: [],
        difficulty: "medium",
        questionType: "single",
        marks: "",
      });
      loadQuestions();
    } catch (err) {
      console.error("Error creating question:", err);
    }
  };

  // Function to delete a question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId)
        .eq("created_by", user.id);
      if (error) throw error;
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  // Function to update a question
  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingQuestion) return;
    try {
      const { error } = await supabase
        .from("questions")
        .update({
          question: editingQuestion.question.trim(),
          options: editingQuestion.options.map((opt) => opt.trim()),
          correct_answer: editingQuestion.correct_answer,
          difficulty: editingQuestion.difficulty,
          questionType: editingQuestion.questionType,
          marks: editingQuestion.marks, // update marks as well
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

  // Function to handle field changes in the edit form
  const handleEditFieldChange = (
    field: keyof Question,
    value:
      | string
      | string[]
      | "easy"
      | "medium"
      | "hard"
      | "single"
      | "multiple"
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

              {/* New: Choose Question Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Question Type
                </label>
                <select
                  value={newQuestion.questionType}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionType: e.target.value as "single" | "multiple",
                      correct_answer: [],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="single">Single Correct Answer</option>
                  <option value="multiple">Multiple Correct Answers</option>
                </select>
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
                        const oldOption = newOptions[index];
                        const updatedOption = e.target.value;
                        newOptions[index] = updatedOption;
                        // Replace the old option with the updated value if it was selected as correct
                        const newCorrect = newQuestion.correct_answer.map(
                          (ans) => (ans === oldOption ? updatedOption : ans)
                        );
                        setNewQuestion({
                          ...newQuestion,
                          options: newOptions,
                          correct_answer: newCorrect,
                        });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Conditional Correct Answer Section */}
              {newQuestion.questionType === "single" ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Answer
                  </label>
                  <select
                    value={newQuestion.correct_answer[0] || ""}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correct_answer: [e.target.value],
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
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Answers
                  </label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={newQuestion.correct_answer.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewQuestion((prev) => ({
                              ...prev,
                              correct_answer: [...prev.correct_answer, option],
                            }));
                          } else {
                            setNewQuestion((prev) => ({
                              ...prev,
                              correct_answer: prev.correct_answer.filter(
                                (ans) => ans !== option
                              ),
                            }));
                          }
                        }}
                      />
                      <span>{option || `Option ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Marks allotment input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Marks
                </label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, marks: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter marks for this question"
                  required
                />
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
                <label className="block text-sm font-medium text-gray-700">
                  Question Type
                </label>
                <select
                  value={editingQuestion.questionType}
                  onChange={(e) =>
                    handleEditFieldChange(
                      "questionType",
                      e.target.value as "single" | "multiple"
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="single">Single Correct Answer</option>
                  <option value="multiple">Multiple Correct Answers</option>
                </select>
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

              {editingQuestion.questionType === "single" ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Answer
                  </label>
                  <select
                    value={editingQuestion.correct_answer[0] || ""}
                    onChange={(e) =>
                      handleEditFieldChange("correct_answer", [e.target.value])
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
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Answers
                  </label>
                  {editingQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={editingQuestion.correct_answer.includes(option)}
                        onChange={() => {
                          const alreadySelected =
                            editingQuestion.correct_answer.includes(option);
                          const newCorrectAnswers = alreadySelected
                            ? editingQuestion.correct_answer.filter(
                                (ans) => ans !== option
                              )
                            : [...editingQuestion.correct_answer, option];
                          handleEditFieldChange(
                            "correct_answer",
                            newCorrectAnswers
                          );
                        }}
                      />
                      <span>{option || `Option ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Marks
                </label>
                <input
                  type="number"
                  value={editingQuestion.marks}
                  onChange={(e) =>
                    handleEditFieldChange("marks", parseInt(e.target.value, 10))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    handleEditFieldChange(
                      "difficulty",
                      e.target.value as "easy" | "medium" | "hard"
                    )
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

      {/* Display Questions */}
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
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    question.difficulty === "easy"
                      ? "bg-green-100 text-green-800"
                      : question.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {question.difficulty}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                  {question.marks} Marks
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {question.options.map((option, index) => {
                // Convert the correct_answer to an array if stored as string
                let correctAnswers: string[];
                if (typeof question.correct_answer === "string") {
                  try {
                    const parsed = JSON.parse(question.correct_answer);
                    correctAnswers = Array.isArray(parsed)
                      ? parsed
                      : [question.correct_answer];
                  } catch (e) {
                    correctAnswers = [question.correct_answer];
                  }
                } else {
                  correctAnswers = question.correct_answer;
                }

                const isCorrect = correctAnswers.some(
                  (ans) =>
                    ans.trim().toLowerCase() === option.trim().toLowerCase()
                );

                return (
                  <div
                    key={index}
                    className={`p-2 rounded flex justify-between items-center ${
                      isCorrect
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    <span>{option}</span>
                    {isCorrect && (
                      <span className="ml-2 text-xs font-semibold text-green-600 uppercase tracking-wide">
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end items-center gap-4 mt-4">
              <button
                onClick={() => {
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

/************************************************
  CreateQuiz.tsx – Updated Intersection Approach
************************************************/
function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [numQuestions, setNumQuestions] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState(""); // The subject/category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Distinct mark values for the chosen subject:
  const [markSections, setMarkSections] = useState<number[]>([]);
  // Teacher input for how many questions they want at each mark:
  const [questionsByMark, setQuestionsByMark] = useState<{ [key: number]: number }>({});

  // Teacher input for how many easy, medium, hard questions:
  const [questionsByDifficulty, setQuestionsByDifficulty] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // 1) Fetch possible subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("classes")
        .select("name")
        .eq("created_by", user.id);

      if (!error && data) {
        setCategories(data.map((cls) => cls.name));
      }
    };
    fetchSubjects();
  }, [user]);

  // 2) Whenever `category` changes, fetch distinct mark values from questions
  useEffect(() => {
    if (!category) {
      setMarkSections([]);
      setQuestionsByMark({});
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("marks")
        .eq("category", category);

      if (!error && data) {
        const markSet = new Set<number>();
        data.forEach((q: { marks: number }) => {
          if (q.marks !== undefined) markSet.add(q.marks);
        });
        const distinctMarks = Array.from(markSet).sort((a, b) => a - b);
        setMarkSections(distinctMarks);

        // initialize each mark's requested count to 0
        const initMarkMap: { [key: number]: number } = {};
        distinctMarks.forEach((m) => {
          initMarkMap[m] = 0;
        });
        setQuestionsByMark(initMarkMap);
      }
    })();
  }, [category]);

  // 3) Handle quiz creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!category) throw new Error("Category (subject) is required");
      if (timeLimit < 1 || timeLimit > 180) {
        throw new Error("Time limit must be between 1 and 180 minutes");
      }
      if (numQuestions < 1) {
        throw new Error("Must include at least one question");
      }

      // ————————————————
      //  A) Summaries
      // ————————————————
      // Sum of teacher’s difficulty requests
      const totalDifficultyRequested =
        questionsByDifficulty.easy +
        questionsByDifficulty.medium +
        questionsByDifficulty.hard;

      // Sum of teacher’s mark requests
      const totalMarkRequested = Object.values(questionsByMark).reduce(
        (sum, val) => sum + val,
        0
      );

      // The teacher expects the final total to be numQuestions
      // BUT now we do an "intersection" approach:
      // Each question must meet exactly one difficulty from the ones requested
      // and exactly one mark from the ones requested.
      // So we do a single query to find that intersection.

      // If the teacher wants 3 total, they might have, say,
      // 2 set aside for "easy" + 1 for "hard" => totalDifficultyRequested=3
      // 2 set aside for "2 marks" + 1 for "5 marks" => totalMarkRequested=3
      // => We want 3 total from the intersection, not 6.

      // Optional check: teacher must ensure they know that each question is exactly one difficulty + one mark.
      // We'll just check that totalDifficultyRequested === numQuestions, and totalMarkRequested === numQuestions,
      // so we know we are expecting exactly numQuestions that satisfy both.
      if (
        totalDifficultyRequested !== numQuestions ||
        totalMarkRequested !== numQuestions
      ) {
        throw new Error(
          "Because each question must satisfy both a single difficulty and a single mark, the sum of difficulty requests AND the sum of mark requests must each equal 'Total Number of Questions'."
        );
      }

      // Collect which difficulties are actually requested
      const requestedDiffs: ("easy" | "medium" | "hard")[] = [];
      (["easy", "medium", "hard"] as const).forEach((level) => {
        if (questionsByDifficulty[level] > 0) requestedDiffs.push(level);
      });

      // Collect which marks are actually requested
      const requestedMarks: number[] = [];
      Object.entries(questionsByMark).forEach(([markStr, needed]) => {
        if (needed > 0) requestedMarks.push(parseInt(markStr, 10));
      });

      // Now do a single query to get all questions matching:
      // difficulty ∈ { requestedDiffs } AND marks ∈ { requestedMarks }
      const { data: intersectionData, error: intersectionError } = await supabase
        .from("questions")
        .select("id, difficulty, marks")
        .eq("category", category)
        .in("difficulty", requestedDiffs)
        .in("marks", requestedMarks);

      if (intersectionError) {
        throw new Error(
          `Failed to fetch intersection of chosen difficulties and marks: ${intersectionError.message}`
        );
      }
      if (!intersectionData || intersectionData.length < numQuestions) {
        throw new Error(
          `Not enough questions that satisfy your difficulty + mark constraints. Need ${numQuestions}, found ${intersectionData?.length || 0}.`
        );
      }

      // Because the teacher assigned EXACT counts for each difficulty and mark,
      // we can’t just pick any from this intersection. Each question must fill
      // exactly one 'easy' or 'medium' or 'hard' slot AND one mark slot.
      // The simplest approach: do a small "greedy" approach:
      //
      // For each difficulty & mark combination, we know the teacher wants
      // min(questionsByDifficulty[difficulty], questionsByMark[mark])?
      // Actually, since each field must match exactly one slot, you might do:
      //    # needed = 1 for each synergy, etc.
      //
      // Below is a straightforward approach that tries to fill difficulty slots
      // and mark slots. If you want a more robust method (like an ILP), you can do so.
      // For demonstration, we'll do a naive approach that attempts to match each difficulty/mark combination
      // based on whichever count is left.
      //
      // If you prefer just to pick the first 'numQuestions' from the intersection, comment out the next code
      // and do something simpler.

      let finalIDs: number[] = [];
      // We'll keep local counters of how many we still need in each difficulty/mark
      let localDiffCount = { ...questionsByDifficulty };
      let localMarkCount = { ...questionsByMark };

      // intersectionData: an array of { id, difficulty, marks }
      // Sort or shuffle if you want random picking
      for (const q of intersectionData) {
        const d = q.difficulty as "easy" | "medium" | "hard";
        const m = q.marks;

        // If we still need a question of difficulty d and also need a question of mark m
        if (localDiffCount[d] > 0 && localMarkCount[m] > 0) {
          // pick this question
          finalIDs.push(q.id);
          // decrement
          localDiffCount[d]--;
          localMarkCount[m]--;

          // If we've picked numQuestions total, break out
          if (finalIDs.length === numQuestions) break;
        }
      }

      // After we attempt picking, see if we satisfied all
      if (finalIDs.length !== numQuestions) {
        throw new Error(
          `Could not allocate enough questions to satisfy the exact difficulty+mark distribution. Picked ${finalIDs.length}, but needed ${numQuestions}.`
        );
      }

      // Insert quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            time_limit: timeLimit,
            questions: finalIDs,
            created_by: user?.id,
            category,
          },
        ]);

      if (quizError) {
        throw new Error(`Failed to create quiz: ${quizError.message}`);
      }

      // Navigate or reset form
      navigate("/teacher/quizzes");
    } catch (err: any) {
      setError(err.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        {/* Title */}
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          >
            <option value="">Select a subject</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Total Number of Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Number of Questions
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        {/* Difficulty-based question selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Number of Questions by Difficulty
          </h3>
          {(["easy", "medium", "hard"] as const).map((level) => (
            <div key={level}>
              <label className="block text-sm font-medium text-gray-700">
                {level.charAt(0).toUpperCase() + level.slice(1)} Questions
              </label>
              <input
                type="number"
                min={0}
                value={questionsByDifficulty[level]}
                onChange={(e) =>
                  setQuestionsByDifficulty((prev) => ({
                    ...prev,
                    [level]: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          ))}
        </div>

        {/* Mark-based question selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Number of Questions by Mark
          </h3>
          {markSections.map((mark) => (
            <div key={mark}>
              <label className="block text-sm font-medium text-gray-700">
                {mark}-Mark Questions
              </label>
              <input
                type="number"
                min={0}
                value={questionsByMark[mark] || 0}
                onChange={(e) =>
                  setQuestionsByMark((prev) => ({
                    ...prev,
                    [mark]: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          ))}
        </div>

        {/* Submit */}
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

// function CreateQuiz() {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [timeLimit, setTimeLimit] = useState(30);
//   const [numQuestions, setNumQuestions] = useState(1);
//   const [categories, setCategories] = useState<string[]>([]);
//   const [category, setCategory] = useState(""); // The subject/category
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // MARKS: Existing states
//   const [markSections, setMarkSections] = useState<number[]>([]);
//   const [questionsByMark, setQuestionsByMark] = useState<{
//     [key: number]: number;
//   }>({});

//   // NEW: Difficulty-based question selection
//   const [questionsByDifficulty, setQuestionsByDifficulty] = useState<{
//     easy: number;
//     medium: number;
//     hard: number;
//   }>({
//     easy: 0,
//     medium: 0,
//     hard: 0,
//   });

//   const user = useAuthStore((state) => state.user);
//   const navigate = useNavigate();

//   // Fetch subjects (categories)
//   // useEffect(() => {
//   //   const fetchSubjects = async () => {
//   //     const { data, error } = await supabase.from("classes").select("name");
//   //     if (error) {
//   //       console.error("Error fetching class titles:", error);
//   //     } else if (data) {
//   //       const classTitles = data.map((cls) => cls.name);
//   //       setCategories(classTitles);
//   //     }
//   //   };
//   //   fetchSubjects();
//   // }, []);

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       if (!user?.id) return; // Ensure user is logged in

//       const { data, error } = await supabase
//         .from("classes")
//         .select("name")
//         .eq("created_by", user.id); // Filter by faculty ID

//       if (error) {
//         console.error("Error fetching class titles:", error);
//       } else if (data) {
//         const classTitles = data.map((cls) => cls.name);
//         setCategories(classTitles);
//       }
//     };

//     fetchSubjects();
//   }, [user]); // Runs when user is available

//   // Fetch distinct mark values (all classes or per category—up to you)
//   useEffect(() => {
//     const fetchMarkSections = async () => {
//       // If you only want to show mark values for the currently selected category,
//       // add: .eq("category", category) if your DB has that data.
//       const { data, error } = await supabase
//         .from("questions")
//         .select("marks", { distinct: true });
//       if (error) {
//         console.error("Error fetching mark sections:", error);
//       } else if (data) {
//         const marksValues = Array.from(new Set(data.map((q) => q.marks)));
//         setMarkSections(marksValues);
//       }
//     };
//     fetchMarkSections();
//   }, []);

//   // Initialize questionsByMark mapping
//   useEffect(() => {
//     if (markSections.length > 0) {
//       const mapping: { [key: number]: number } = {};
//       markSections.forEach((mark) => {
//         mapping[mark] = 0;
//       });
//       setQuestionsByMark(mapping);
//     }
//   }, [markSections]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // Basic validations
//       if (!title.trim()) throw new Error("Title is required");
//       if (timeLimit < 1 || timeLimit > 180) {
//         throw new Error("Time limit must be between 1 and 180 minutes");
//       }
//       if (numQuestions < 1) {
//         throw new Error("Must include at least one question");
//       }
//       if (!category) {
//         throw new Error("Category (subject) is required");
//       }

//       // Sum up all the specifically requested questions by mark
//       const totalMarkRequests = Object.values(questionsByMark).reduce(
//         (sum, count) => sum + count,
//         0
//       );

//       // Sum up all the specifically requested questions by difficulty
//       const totalDifficultyRequests =
//         questionsByDifficulty.easy +
//         questionsByDifficulty.medium +
//         questionsByDifficulty.hard;

//       // Combined total of "special" requests
//       const combinedSpecialRequests =
//         totalMarkRequests + totalDifficultyRequests;

//       if (combinedSpecialRequests > numQuestions) {
//         throw new Error(
//           "You are requesting more special-criteria questions than the total number of questions"
//         );
//       }

//       // 1) Fetch questions by MARK
//       let specificMarkQuestionIds: number[] = [];
//       for (const markStr of Object.keys(questionsByMark)) {
//         const mark = Number(markStr);
//         const count = questionsByMark[mark];
//         if (count > 0) {
//           // Query the DB for that mark, in the selected category
//           const { data: markQuestions, error: markQuestionError } =
//             await supabase
//               .from("questions")
//               .select("id")
//               .eq("category", category)
//               .eq("marks", mark);

//           if (markQuestionError) {
//             throw new Error(`Failed to fetch questions for ${mark} mark`);
//           }
//           if (!markQuestions || markQuestions.length < count) {
//             throw new Error(
//               `Not enough questions for ${mark} mark in this subject`
//             );
//           }

//           // Take the first "count" questions or pick them randomly
//           const pickedIds = markQuestions.slice(0, count).map((q) => q.id);
//           specificMarkQuestionIds = [...specificMarkQuestionIds, ...pickedIds];
//         }
//       }

//       // 2) Fetch questions by DIFFICULTY
//       let difficultyQuestionIds: number[] = [];
//       type DiffLevels = "easy" | "medium" | "hard";
//       for (const level of ["easy", "medium", "hard"] as DiffLevels[]) {
//         const count = questionsByDifficulty[level];
//         if (count > 0) {
//           const { data: diffQuestions, error: diffError } = await supabase
//             .from("questions")
//             .select("id")
//             .eq("category", category)
//             .eq("difficulty", level);

//           if (diffError) throw new Error(`Failed to fetch ${level} questions`);
//           if (!diffQuestions || diffQuestions.length < count) {
//             throw new Error(
//               `Not enough ${level} questions available in this subject`
//             );
//           }

//           const pickedDiffIds = diffQuestions.slice(0, count).map((q) => q.id);
//           difficultyQuestionIds = [...difficultyQuestionIds, ...pickedDiffIds];
//         }
//       }

//       // Combine the special criteria IDs
//       let specialIDs = [...specificMarkQuestionIds, ...difficultyQuestionIds];

//       // Remove duplicates (if a question meets both mark + difficulty)
//       specialIDs = Array.from(new Set(specialIDs));

//       // 3) If there's still room for more questions (numQuestions - specialIDs.length),
//       //    fetch "general" questions that are NOT already used.
//       const stillNeeded = numQuestions - specialIDs.length;
//       let generalIDs: number[] = [];
//       if (stillNeeded > 0) {
//         // For example, fetch any questions in the chosen category that are
//         // not already in specialIDs
//         const { data: generalQuestions, error: generalError } = await supabase
//           .from("questions")
//           .select("id")
//           .eq("category", category)
//           // Possibly exclude the difficulties or marks you already used
//           // For example, .not("id","in",`(${specialIDs.join(',')})`) if you want distinct questions.
//           .not("id", "in", `(${specialIDs.join(",")})`);

//         if (generalError) throw new Error("Failed to fetch general questions");
//         if (!generalQuestions || generalQuestions.length < stillNeeded) {
//           throw new Error(
//             "Not enough general questions available for your total question count"
//           );
//         }

//         // Take the needed count from the general pool
//         const selectedGeneral = generalQuestions
//           .slice(0, stillNeeded)
//           .map((q) => q.id);
//         generalIDs = [...selectedGeneral];
//       }

//       // Final array of question IDs
//       const finalQuestionIds = [...specialIDs, ...generalIDs];

//       // Insert quiz record
//       const { error: quizError } = await supabase.from("quizzes").insert([
//         {
//           title: title.trim(),
//           description: description.trim(),
//           time_limit: timeLimit,
//           questions: finalQuestionIds, // an array of question IDs
//           created_by: user?.id,
//           category,
//         },
//       ]);

//       if (quizError) {
//         console.error("Quiz creation error:", quizError);
//         throw new Error("Failed to create quiz");
//       }

//       // Navigate or do whatever after success
//       navigate("/teacher/quizzes");
//     } catch (err: any) {
//       setError(err?.message || "Failed to create quiz");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h2>
//       <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* Title */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Title
//           </label>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//             required
//           />
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Description
//           </label>
//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//             rows={3}
//           />
//         </div>

//         {/* Subject / Category */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Subject
//           </label>
//           <select
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//             required
//           >
//             <option value="">Select a subject</option>
//             {categories.map((cat) => (
//               <option key={cat} value={cat}>
//                 {cat}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Time Limit */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Time Limit (minutes)
//           </label>
//           <input
//             type="number"
//             value={timeLimit}
//             onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
//             min="1"
//             max="180"
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//           />
//         </div>

//         {/* Total number of questions */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Total Number of Questions
//           </label>
//           <input
//             type="number"
//             value={numQuestions}
//             onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
//             min="1"
//             max="50"
//             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//           />
//         </div>

//         {/* Mark-based question selection */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800">
//             Specify Questions by Marks
//           </h3>
//           {markSections.map((mark) => (
//             <div key={mark}>
//               <label className="block text-sm font-medium text-gray-700">
//                 Number of {mark} Mark Questions
//               </label>
//               <input
//                 type="number"
//                 value={questionsByMark[mark] || 0}
//                 onChange={(e) =>
//                   setQuestionsByMark({
//                     ...questionsByMark,
//                     [mark]: parseInt(e.target.value, 10) || 0,
//                   })
//                 }
//                 min="0"
//                 max="50"
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//               />
//             </div>
//           ))}
//         </div>

//         {/* Difficulty-based question selection */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800">
//             Specify Questions by Difficulty
//           </h3>
//           {(["easy", "medium", "hard"] as const).map((level) => (
//             <div key={level}>
//               <label className="block text-sm font-medium text-gray-700">
//                 Number of {level} Questions
//               </label>
//               <input
//                 type="number"
//                 value={questionsByDifficulty[level]}
//                 onChange={(e) =>
//                   setQuestionsByDifficulty({
//                     ...questionsByDifficulty,
//                     [level]: parseInt(e.target.value, 10) || 0,
//                   })
//                 }
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
//                 min="0"
//                 max="50"
//               />
//             </div>
//           ))}
//         </div>

//         {/* Submit */}
//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
//             loading ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {loading ? "Creating Quiz..." : "Create Quiz"}
//         </button>
//       </form>
//     </div>
//   );
// }

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
