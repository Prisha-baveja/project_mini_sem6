import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { GraduationCap, Book, LogOut, Clock, Award, AlertCircle, UserPlus, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Quiz {
  id: string;
  title: string;
  answers_released: boolean;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit: number;
  questions: string[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
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
          to="/student/join"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <UserPlus className="w-5 h-5" />
          Join Class
        </Link>

        <Link
          to="/student/my-classes"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <User className="w-5 h-5" />
          My Classes
        </Link>

        <Link
          to="/student/history"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <Award className="w-5 h-5" />
          My Results
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

function MyClasses() {
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  const fetchMyClasses = async () => {
    setLoading(true);
    setError("");
    try {
      // Query the class_members table, joining the classes table
     const { data, error } = await supabase
       .from("class_members")
       .select("*, classes!class_members_class_id_fkey(*)")
       .eq("student_id", user.id);


      if (error) throw error;
      setMyClasses(data);
    } catch (err) {
      console.error("Error fetching my classes:", err);
      setError("Failed to load your classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Classes</h2>
      {myClasses.length === 0 ? (
        <div>You haven't joined any classes yet.</div>
      ) : (
        <div className="grid gap-4">
          {myClasses.map((membership) => {
            const joinedClass = membership.classes;
            return (
              <div
                key={membership.id}
                className="bg-white p-4 rounded-lg shadow"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {joinedClass.name}
                </h3>
                <p className="text-gray-500">{joinedClass.description}</p>
                <Link
                  to={`/student/class/${joinedClass.id}`}
                  className="mt-2 inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClassDetails() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch the class details from the classes table using classId
      const { data: fetchedClass, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (classError || !fetchedClass) {
        throw classError || new Error("Class not found.");
      }
      setClassData(fetchedClass);

      // Now, use the class name as the category to fetch quizzes.
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("category", fetchedClass.name) // Ensure that your quizzes table has a column named "category"
        .order("created_at", { ascending: false });

      if (quizError) {
        throw quizError;
      }
      setQuizzes(quizData);
    } catch (err) {
      console.error("Error fetching class details or quizzes:", err);
      setError("Failed to load class details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {classData.name} - Quizzes
      </h2>
      {quizzes.length === 0 ? (
        <div>No quizzes available for this class.</div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">
                {quiz.title}
              </h3>
              <p className="text-gray-500">{quiz.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                Time limit: {quiz.time_limit} minutes
              </div>
              <button
                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// function TakeQuiz() {
//   const { quizId } = useParams<{ quizId: string }>();
//   const [quiz, setQuiz] = useState<Quiz | null>(null);
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   // Store answers as an object mapping question IDs to an array of selected options.
//   const [answers, setAnswers] = useState<Record<string, string[]>>({});
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [hasAttempted, setHasAttempted] = useState(false);
//   const navigate = useNavigate();
//   const user = useAuthStore((state) => state.user);

//   useEffect(() => {
//     if (quizId && user) {
//       checkPreviousAttempt();
//       loadQuiz();
//     }
//   }, [quizId, user]);

//   const checkPreviousAttempt = async () => {
//     if (!user || !quizId) return;
//     try {
//       // Using maybeSingle() so that if no attempt exists, it returns null without error.
//       const { data, error } = await supabase
//         .from("quiz_attempts")
//         .select("id")
//         .eq("quiz_id", quizId)
//         .eq("user_id", user.id)
//         .maybeSingle();
//       if (data) {
//         setHasAttempted(true);
//       }
//       if (error && error.code !== "PGRST116") {
//         console.error("Error checking quiz attempt:", error);
//       }
//     } catch (err) {
//       console.error("Error in checkPreviousAttempt:", err);
//     }
//   };

//   const loadQuiz = async () => {
//     try {
//       const { data: quizData, error } = await supabase
//         .from("quizzes")
//         .select("*")
//         .eq("id", quizId)
//         .maybeSingle();

//       if (error) throw error;

//       if (quizData) {
//         // Check if the quiz is released.
//         if (!quizData.release_quiz) {
//           alert("This quiz is not released yet.");
//           navigate("/student");
//           return;
//         }
//         setQuiz(quizData);
//         // Set initial timer value in seconds.
//         setTimeLeft(quizData.time_limit * 60);

//         // Load questions using the array of question IDs stored in quizData.questions.
//         const { data: questionData, error: questionError } = await supabase
//           .from("questions")
//           .select("id, question, options, correct_answer, questionType, marks")
//           .in("id", quizData.questions);

//         if (questionError) throw questionError;

//         if (questionData) {
//           const formattedQuestions = questionData.map((q) => ({
//             ...q,
//             options:
//               typeof q.options === "string" ? JSON.parse(q.options) : q.options,
//             correct_answer:
//               typeof q.correct_answer === "string"
//                 ? JSON.parse(q.correct_answer)
//                 : q.correct_answer,
//           }));
//           setQuestions(formattedQuestions);
//         }
//       }
//     } catch (err) {
//       console.error("Error loading quiz:", err);
//     }
//   };

//   // Timer effect: decrement the timer every second and auto-submit when time runs out.
//   useEffect(() => {
//     if (quiz && timeLeft !== null) {
//       const interval = setInterval(() => {
//         setTimeLeft((prevTime) => {
//           if (prevTime !== null) {
//             if (prevTime <= 1) {
//               clearInterval(interval);
//               handleSubmit();
//               return 0;
//             }
//             return prevTime - 1;
//           }
//           return null;
//         });
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [quiz, timeLeft]);

//   const handleAnswer = (option: string) => {
//     const question = questions[currentQuestion];
//     const qid = question.id;
//     const currentAns = answers[qid] || [];

//     if (question.questionType === "multiple") {
//       // Toggle the option for multiple-correct questions.
//       if (currentAns.includes(option)) {
//         setAnswers({
//           ...answers,
//           [qid]: currentAns.filter((ans) => ans !== option),
//         });
//       } else {
//         setAnswers({
//           ...answers,
//           [qid]: [...currentAns, option],
//         });
//       }
//     } else {
//       // For single correct questions, replace any previous answer.
//       setAnswers({
//         ...answers,
//         [qid]: [option],
//       });
//     }
//   };

//   // Helper function to normalize answers
//   const normalizeAnswer = (answer: string) => answer.trim().toLowerCase();

//   const handleSubmit = async () => {
//     if (hasAttempted) {
//       alert("You have already attempted this quiz.");
//       return;
//     }
//     if (!quiz || !user) return;

//     let score = 0;
//     let totalMarks = 0;

//     questions.forEach((question) => {
//       const questionMarks = Number(question.marks) || 0;
//       totalMarks += questionMarks;
//       const given = answers[question.id] || [];

//       if (question.questionType === "multiple") {
//         let correct = question.correct_answer;
//         if (typeof correct === "string" && correct.trim().startsWith("[")) {
//           try {
//             correct = JSON.parse(correct);
//           } catch (error) {
//             console.error("Error parsing correct_answer:", error);
//           }
//         }
//         if (Array.isArray(correct)) {
//           const normalizedCorrect = correct
//             .map((a: string) => a.trim().toLowerCase())
//             .sort();
//           const normalizedGiven = given
//             .map((a: string) => a.trim().toLowerCase())
//             .sort();
//           if (
//             normalizedGiven.length === normalizedCorrect.length &&
//             normalizedGiven.every(
//               (ans, index) => ans === normalizedCorrect[index]
//             )
//           ) {
//             score += questionMarks;
//           }
//         }
//       } else {
//         let correct = question.correct_answer;
//         if (typeof correct === "string" && correct.trim().startsWith("[")) {
//           try {
//             correct = JSON.parse(correct);
//           } catch (error) {
//             console.error(
//               "Error parsing correct_answer for single correct question:",
//               error
//             );
//           }
//         }
//         if (Array.isArray(correct)) {
//           correct = correct[0];
//         }
//         if (
//           given[0] &&
//           given[0].trim().toLowerCase() === String(correct).trim().toLowerCase()
//         ) {
//           score += questionMarks;
//         }
//       }
//     });

//     console.log("Calculated Score:", score, "Total Marks:", totalMarks);

//     try {
//       const { data, error } = await supabase
//         .from("quiz_attempts")
//         .insert([
//           {
//             quiz_id: quiz.id,
//             user_id: user.id,
//             score: Number(score),
//             answers,
//             completed_at: new Date(),
//           },
//         ])
//         .select(); // returning the inserted row for debugging

//       if (error) {
//         console.error("Insert error:", error);
//         throw error;
//       }

//       console.log("Inserted attempt data:", data);
//       navigate("/student/history");
//     } catch (error) {
//       console.error("Error submitting quiz:", error);
//       alert("Failed to submit quiz. Please try again.");
//     }
//   };

//   if (hasAttempted) {
//     return (
//       <div className="p-6 max-w-3xl mx-auto">
//         <div className="bg-red-100 border border-red-300 text-red-800 p-6 rounded-lg text-center">
//           <p className="text-xl font-bold mb-4">
//             You have already attempted this quiz.
//           </p>
//           <p className="mb-6">You cannot attempt it again.</p>
//           <button
//             onClick={() => navigate("/student/history")}
//             className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
//           >
//             View Quiz History
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!quiz || questions.length === 0) return null;

//   const question = questions[currentQuestion];
//   const minutes = Math.floor((timeLeft || 0) / 60);
//   const seconds = (timeLeft || 0) % 60;

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
//           <div className="flex items-center gap-2 text-purple-600">
//             <Clock className="w-5 h-5" />
//             {minutes}:{seconds.toString().padStart(2, "0")}
//           </div>
//         </div>

//         <div className="mb-6">
//           <div className="text-sm text-gray-500 mb-2">
//             Question {currentQuestion + 1} of {questions.length}
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-purple-600 rounded-full h-2"
//               style={{
//                 width: `${((currentQuestion + 1) / questions.length) * 100}%`,
//               }}
//             />
//           </div>
//         </div>

//         <div className="mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             {question.question}
//           </h3>
//           <p className="text-sm text-gray-500">Marks: {question.marks}</p>
//           <p className="text-sm text-gray-500">Type: {question.questionType}</p>
//         </div>

//         <div className="space-y-3">
//           {question.options.map((option, index) => {
//             const selected = answers[question.id]?.includes(option);
//             return (
//               <button
//                 key={index}
//                 onClick={() => handleAnswer(option)}
//                 className={`w-full p-3 text-left rounded-lg border ${
//                   selected
//                     ? "border-purple-600 bg-purple-50"
//                     : "border-gray-300 hover:border-purple-600"
//                 }`}
//               >
//                 {option}
//               </button>
//             );
//           })}
//         </div>

//         <div className="mt-6 flex justify-between">
//           <button
//             onClick={() => setCurrentQuestion(currentQuestion - 1)}
//             disabled={currentQuestion === 0}
//             className="px-4 py-2 text-purple-600 disabled:text-gray-400"
//           >
//             Previous
//           </button>
//           {currentQuestion === questions.length - 1 ? (
//             <button
//               onClick={handleSubmit}
//               className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
//             >
//               Submit
//             </button>
//           ) : (
//             <button
//               onClick={() => setCurrentQuestion(currentQuestion + 1)}
//               disabled={
//                 !answers[question.id] || answers[question.id].length === 0
//               }
//               className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
//             >
//               Next
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function TakeQuiz() {
//   const { quizId } = useParams<{ quizId: string }>();
//   const navigate = useNavigate();
//   const user = useAuthStore((state) => state.user);
//   const [quiz, setQuiz] = useState<Quiz | null>(null);
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   // Store answers as an object mapping question IDs to an array of selected options.
//   const [answers, setAnswers] = useState<Record<string, string[]>>({});
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [hasAttempted, setHasAttempted] = useState(false);
//   // State to track tab switches.
//   const [tabSwitchCount, setTabSwitchCount] = useState(0);
//   // New state to track desktop changes (approximated via window blur events)
//   const [desktopChangeCount, setDesktopChangeCount] = useState(0);

//   useEffect(() => {
//     if (quizId && user) {
//       checkPreviousAttempt();
//       loadQuiz();
//     }
//   }, [quizId, user]);

//   // Listen for tab switches or when the browser is minimized.
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         console.log("User switched tab or minimized the browser.");
//         setTabSwitchCount((prev) => prev + 1);
//       }
//     };
//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () =>
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//   }, []);

//   // Listen for window blur events as an approximation for desktop changes.
//   useEffect(() => {
//     const handleWindowBlur = () => {
//       console.log("Window lost focus - possible desktop change.");
//       setDesktopChangeCount((prev) => prev + 1);
//     };
//     window.addEventListener("blur", handleWindowBlur);
//     return () => window.removeEventListener("blur", handleWindowBlur);
//   }, []);

//   const checkPreviousAttempt = async () => {
//     if (!user || !quizId) return;
//     try {
//       const { data, error } = await supabase
//         .from("quiz_attempts")
//         .select("id")
//         .eq("quiz_id", quizId)
//         .eq("user_id", user.id)
//         .maybeSingle();
//       if (data) {
//         setHasAttempted(true);
//       }
//       if (error && error.code !== "PGRST116") {
//         console.error("Error checking quiz attempt:", error);
//       }
//     } catch (err) {
//       console.error("Error in checkPreviousAttempt:", err);
//     }
//   };

//   const loadQuiz = async () => {
//     try {
//       const { data: quizData, error } = await supabase
//         .from("quizzes")
//         .select("*")
//         .eq("id", quizId)
//         .maybeSingle();

//       if (error) throw error;

//       if (quizData) {
//         if (!quizData.release_quiz) {
//           alert("This quiz is not released yet.");
//           navigate("/student");
//           return;
//         }
//         setQuiz(quizData);
//         setTimeLeft(quizData.time_limit * 60);

//         const { data: questionData, error: questionError } = await supabase
//           .from("questions")
//           .select("id, question, options, correct_answer, questionType, marks")
//           .in("id", quizData.questions);

//         if (questionError) throw questionError;

//         if (questionData) {
//           const formattedQuestions = questionData.map((q) => ({
//             ...q,
//             options:
//               typeof q.options === "string" ? JSON.parse(q.options) : q.options,
//             correct_answer:
//               typeof q.correct_answer === "string"
//                 ? JSON.parse(q.correct_answer)
//                 : q.correct_answer,
//           }));
//           setQuestions(formattedQuestions);
//         }
//       }
//     } catch (err) {
//       console.error("Error loading quiz:", err);
//     }
//   };

//   // Timer effect: decrement timer every second and auto-submit when time runs out.
//   useEffect(() => {
//     if (quiz && timeLeft !== null) {
//       const interval = setInterval(() => {
//         setTimeLeft((prevTime) => {
//           if (prevTime !== null) {
//             if (prevTime <= 1) {
//               clearInterval(interval);
//               handleSubmit();
//               return 0;
//             }
//             return prevTime - 1;
//           }
//           return null;
//         });
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [quiz, timeLeft]);

//   const handleAnswer = (option: string) => {
//     const question = questions[currentQuestion];
//     const qid = question.id;
//     const currentAns = answers[qid] || [];

//     if (question.questionType === "multiple") {
//       if (currentAns.includes(option)) {
//         setAnswers({
//           ...answers,
//           [qid]: currentAns.filter((ans) => ans !== option),
//         });
//       } else {
//         setAnswers({
//           ...answers,
//           [qid]: [...currentAns, option],
//         });
//       }
//     } else {
//       setAnswers({
//         ...answers,
//         [qid]: [option],
//       });
//     }
//   };

//   const normalizeAnswer = (answer: string) => answer.trim().toLowerCase();

//   // const handleSubmit = async () => {
//   //   if (hasAttempted) {
//   //     alert("You have already attempted this quiz.");
//   //     return;
//   //   }
//   //   if (!quiz || !user) return;

//   //   let score = 0;
//   //   let totalMarks = 0;

//   //   questions.forEach((question) => {
//   //     const questionMarks = Number(question.marks) || 0;
//   //     totalMarks += questionMarks;
//   //     const given = answers[question.id] || [];

//   //     if (question.questionType === "multiple") {
//   //       let correct = question.correct_answer;
//   //       if (typeof correct === "string" && correct.trim().startsWith("[")) {
//   //         try {
//   //           correct = JSON.parse(correct);
//   //         } catch (error) {
//   //           console.error("Error parsing correct_answer:", error);
//   //         }
//   //       }
//   //       if (Array.isArray(correct)) {
//   //         const normalizedCorrect = correct
//   //           .map((a: string) => a.trim().toLowerCase())
//   //           .sort();
//   //         const normalizedGiven = given
//   //           .map((a: string) => a.trim().toLowerCase())
//   //           .sort();
//   //         if (
//   //           normalizedGiven.length === normalizedCorrect.length &&
//   //           normalizedGiven.every(
//   //             (ans, index) => ans === normalizedCorrect[index]
//   //           )
//   //         ) {
//   //           score += questionMarks;
//   //         }
//   //       }
//   //     } else {
//   //       let correct = question.correct_answer;
//   //       if (typeof correct === "string" && correct.trim().startsWith("[")) {
//   //         try {
//   //           correct = JSON.parse(correct);
//   //         } catch (error) {
//   //           console.error(
//   //             "Error parsing correct_answer for single correct question:",
//   //             error
//   //           );
//   //         }
//   //       }
//   //       if (Array.isArray(correct)) {
//   //         correct = correct[0];
//   //       }
//   //       if (
//   //         given[0] &&
//   //         given[0].trim().toLowerCase() === String(correct).trim().toLowerCase()
//   //       ) {
//   //         score += questionMarks;
//   //       }
//   //     }
//   //   });

//   //   console.log("Calculated Score:", score, "Total Marks:", totalMarks);

//   //   try {
//   //     const { data, error } = await supabase
//   //       .from("quiz_attempts")
//   //       .insert([
//   //         {
//   //           quiz_id: quiz.id,
//   //           user_id: user.id,
//   //           score: Number(score),
//   //           answers,
//   //           completed_at: new Date(),
//   //         },
//   //       ])
//   //       .select();

//   //     if (error) {
//   //       console.error("Insert error:", error);
//   //       throw error;
//   //     }

//   //     console.log("Inserted attempt data:", data);
//   //     navigate("/student/history");
//   //   } catch (error) {
//   //     console.error("Error submitting quiz:", error);
//   //     alert("Failed to submit quiz. Please try again.");
//   //   }
//   // };

//     const handleSubmit = async () => {
//       if (hasAttempted) {
//         alert("You have already attempted this quiz.");
//         return;
//       }
//       if (!quiz || !user) return;

//       let score = 0;
//       let totalMarks = 0;

//       questions.forEach((question) => {
//         const questionMarks = Number(question.marks) || 0;
//         totalMarks += questionMarks;
//         const given = answers[question.id] || [];
//         // For testing: if any answer is provided, award full marks
//         if (given.length > 0) {
//           score += questionMarks;
//         }
//       });

//       console.log("Calculated Score:", score, "Total Marks:", totalMarks);

//       try {
//         // If your 'answers' column is of type JSON, pass the answers object directly.
//         const result = await supabase
//           .from("quiz_attempts")
//           .insert([
//             {
//               quiz_id: quiz.id,
//               user_id: user.id,
//               score: score,
//               answers: answers, // Pass directly if the column is JSON.
//               tab_switch_count: tabSwitchCount,
//               desktop_change_count: desktopChangeCount,
//               completed_at: new Date(),
//             },
//           ])
//           .select();

//         if (result.error) {
//           console.error("Insert error:", JSON.stringify(result.error, null, 2));
//           throw result.error;
//         }

//         console.log("Inserted attempt data:", result.data);
//         navigate("/student/history");
//       } catch (err) {
//         console.error("Error submitting quiz:", err);
//         alert("Failed to submit quiz. Please try again.");
//       }
//     };

//   if (hasAttempted) {
//     return (
//       <div className="p-6 max-w-3xl mx-auto">
//         <div className="bg-red-100 border border-red-300 text-red-800 p-6 rounded-lg text-center">
//           <p className="text-xl font-bold mb-4">
//             You have already attempted this quiz.
//           </p>
//           <p className="mb-6">You cannot attempt it again.</p>
//           <button
//             onClick={() => navigate("/student/history")}
//             className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
//           >
//             View Quiz History
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!quiz || questions.length === 0) return null;

//   const question = questions[currentQuestion];
//   const minutes = Math.floor((timeLeft || 0) / 60);
//   const seconds = (timeLeft || 0) % 60;

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
//           <div className="flex flex-col items-end">
//             <div className="text-sm text-red-600">
//               Tab switches: {tabSwitchCount}
//             </div>
//             <div className="text-sm text-blue-600">
//               Desktop changes: {desktopChangeCount}
//             </div>
//             <div className="flex items-center gap-2 text-purple-600">
//               <Clock className="w-5 h-5" />
//               {minutes}:{seconds.toString().padStart(2, "0")}
//             </div>
//           </div>
//         </div>

//         <div className="mb-6">
//           <div className="text-sm text-gray-500 mb-2">
//             Question {currentQuestion + 1} of {questions.length}
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-purple-600 rounded-full h-2"
//               style={{
//                 width: `${((currentQuestion + 1) / questions.length) * 100}%`,
//               }}
//             />
//           </div>
//         </div>

//         <div className="mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             {question.question}
//           </h3>
//           <p className="text-sm text-gray-500">Marks: {question.marks}</p>
//           <p className="text-sm text-gray-500">Type: {question.questionType}</p>
//         </div>

//         <div className="space-y-3">
//           {question.options.map((option, index) => {
//             const selected = answers[question.id]?.includes(option);
//             return (
//               <button
//                 key={index}
//                 onClick={() => handleAnswer(option)}
//                 className={`w-full p-3 text-left rounded-lg border ${
//                   selected
//                     ? "border-purple-600 bg-purple-50"
//                     : "border-gray-300 hover:border-purple-600"
//                 }`}
//               >
//                 {option}
//               </button>
//             );
//           })}
//         </div>

//         <div className="mt-6 flex justify-between">
//           <button
//             onClick={() => setCurrentQuestion(currentQuestion - 1)}
//             disabled={currentQuestion === 0}
//             className="px-4 py-2 text-purple-600 disabled:text-gray-400"
//           >
//             Previous
//           </button>
//           {currentQuestion === questions.length - 1 ? (
//             <button
//               onClick={handleSubmit}
//               className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
//             >
//               Submit
//             </button>
//           ) : (
//             <button
//               onClick={() => setCurrentQuestion(currentQuestion + 1)}
//               disabled={
//                 !answers[question.id] || answers[question.id].length === 0
//               }
//               className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
//             >
//               Next
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

function TakeQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Store answers as an object mapping question IDs to an array of selected options.
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  // State to track tab switches.
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  // State to track desktop changes (approximated via window blur events)
  const [desktopChangeCount, setDesktopChangeCount] = useState(0);

  useEffect(() => {
    if (quizId && user) {
      checkPreviousAttempt();
      loadQuiz();
    }
  }, [quizId, user]);

  // Listen for tab switches or when the browser is minimized.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("User switched tab or minimized the browser.");
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Listen for window blur events as an approximation for desktop changes.
  useEffect(() => {
    const handleWindowBlur = () => {
      console.log("Window lost focus - possible desktop change.");
      setDesktopChangeCount((prev) => prev + 1);
    };
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

  const checkPreviousAttempt = async () => {
    if (!user || !quizId) return;
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setHasAttempted(true);
      }
      if (error && error.code !== "PGRST116") {
        console.error("Error checking quiz attempt:", error);
      }
    } catch (err) {
      console.error("Error in checkPreviousAttempt:", err);
    }
  };

  const loadQuiz = async () => {
    try {
      const { data: quizData, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .maybeSingle();

      if (error) throw error;

      if (quizData) {
        if (!quizData.release_quiz) {
          alert("This quiz is not released yet.");
          navigate("/student");
          return;
        }
        setQuiz(quizData);
        setTimeLeft(quizData.time_limit * 60);

        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("id, question, options, correct_answer, questionType, marks")
          .in("id", quizData.questions);

        if (questionError) throw questionError;

        if (questionData) {
          const formattedQuestions = questionData.map((q) => ({
            ...q,
            options:
              typeof q.options === "string" ? JSON.parse(q.options) : q.options,
            correct_answer:
              typeof q.correct_answer === "string"
                ? JSON.parse(q.correct_answer)
                : q.correct_answer,
          }));
          setQuestions(formattedQuestions);
        }
      }
    } catch (err) {
      console.error("Error loading quiz:", err);
    }
  };

  // Timer effect: decrement timer every second and auto-submit when time runs out.
  useEffect(() => {
    if (quiz && timeLeft !== null) {
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime !== null) {
            if (prevTime <= 1) {
              clearInterval(interval);
              handleSubmit();
              return 0;
            }
            return prevTime - 1;
          }
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz, timeLeft]);

  // For multiple-choice questions.
  const handleAnswer = (option: string) => {
    const question = questions[currentQuestion];
    const qid = question.id;
    const currentAns = answers[qid] || [];
    if (question.questionType === "multiple") {
      if (currentAns.includes(option)) {
        setAnswers({
          ...answers,
          [qid]: currentAns.filter((ans) => ans !== option),
        });
      } else {
        setAnswers({
          ...answers,
          [qid]: [...currentAns, option],
        });
      }
    } else {
      setAnswers({
        ...answers,
        [qid]: [option],
      });
    }
  };

  // For fill/numerical type questions.
  const handleInputAnswer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Store answer in lowercase for case-insensitive evaluation.
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: [value.toLowerCase()],
    });
  };

  const handleSubmit = async () => {
    if (hasAttempted) {
      alert("You have already attempted this quiz.");
      return;
    }
    if (!quiz || !user) return;

    let score = 0;
    let totalMarks = 0;
    questions.forEach((question) => {
      const questionMarks = Number(question.marks) || 0;
      totalMarks += questionMarks;
      const given = answers[question.id] || [];
      // For testing: if any answer is provided, award full marks.
      if (given.length > 0) {
        score += questionMarks;
      }
    });
    console.log("Calculated Score:", score, "Total Marks:", totalMarks);

    try {
      const result = await supabase
        .from("quiz_attempts")
        .insert([
          {
            quiz_id: quiz.id,
            user_id: user.id,
            score: score,
            answers: JSON.stringify(answers),
            tab_switch_count: tabSwitchCount,
            desktop_change_count: desktopChangeCount,
            completed_at: new Date(),
          },
        ])
        .select();
      if (result.error) {
        console.error("Insert error:", JSON.stringify(result.error, null, 2));
        throw result.error;
      }
      console.log("Inserted attempt data:", result.data);
      navigate("/student/history");
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  if (hasAttempted) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-100 border border-red-300 text-red-800 p-6 rounded-lg text-center">
          <p className="text-xl font-bold mb-4">
            You have already attempted this quiz.
          </p>
          <p className="mb-6">You cannot attempt it again.</p>
          <button
            onClick={() => navigate("/student/history")}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            View Quiz History
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) return null;

  const question = questions[currentQuestion];
  const minutes = Math.floor((timeLeft || 0) / 60);
  const seconds = (timeLeft || 0) % 60;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-purple-600">
              <Clock className="w-5 h-5" />
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 rounded-full h-2"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {question.question}
          </h3>
          <p className="text-sm text-gray-500">Marks: {question.marks}</p>
          <p className="text-sm text-gray-500">Type: {question.questionType}</p>
        </div>

        <div className="space-y-3">
          {question.questionType === "fill" ||
          question.questionType === "numerical" ? (
            <input
              type="text"
              placeholder="Type your answer here..."
              value={answers[question.id]?.[0] || ""}
              onChange={handleInputAnswer}
              className="w-full p-3 border rounded-md focus:border-purple-600 focus:ring-purple-500"
            />
          ) : (
            question.options.map((option, index) => {
              const selected = answers[question.id]?.includes(option);
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-3 text-left rounded-lg border ${
                    selected
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-300 hover:border-purple-600"
                  }`}
                >
                  {option}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-purple-600 disabled:text-gray-400"
          >
            Previous
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={
                !answers[question.id] || answers[question.id].length === 0
              }
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizHistory() {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [questions, setQuestions] = useState({});
  const user = useAuthStore((state) => state.user);

  // Helper function to normalize strings.
  const normalize = (text) => String(text).trim().toLowerCase();

  useEffect(() => {
    if (user) {
      loadAttempts();
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("Loaded quiz data:", data);
  };

  const loadAttempts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*, quiz:quizzes(*)")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      if (data) {
        console.log("Loaded attempts with quiz data:", data);
        setAttempts(data);
      }
    } catch (error) {
      console.error("Error loading attempts:", error);
    }
  };

  const loadQuestionDetails = async (questionIds) => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("id, question, options, correct_answer, questionType, marks")
        .in("id", questionIds);
      if (error) throw error;
      if (data) {
        // Parse the options and correct_answer fields if they are strings.
        const questionMap = data.reduce((acc, q) => {
          const parsedOptions =
            typeof q.options === "string" ? JSON.parse(q.options) : q.options;
          let parsedCorrectAnswer = q.correct_answer;
          if (
            typeof q.correct_answer === "string" &&
            q.correct_answer.trim().startsWith("[")
          ) {
            try {
              parsedCorrectAnswer = JSON.parse(q.correct_answer);
            } catch (err) {
              console.error("Error parsing correct_answer:", err);
            }
          }
          acc[q.id] = {
            ...q,
            options: parsedOptions,
            correct_answer: parsedCorrectAnswer,
          };
          return acc;
        }, {});
        setQuestions(questionMap);
      }
    } catch (error) {
      console.error("Error loading question details:", error);
    }
  };

  useEffect(() => {
    if (selectedAttempt && selectedAttempt.quiz?.questions) {
      loadQuestionDetails(selectedAttempt.quiz.questions);
    }
  }, [selectedAttempt]);

  if (!user) {
    return <div>Please log in to view your quiz history.</div>;
  }

  if (attempts.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Results</h2>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">
            You haven't attempted any quizzes yet.
          </p>
          <Link
            to="/student"
            className="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Take a Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Results</h2>
      <div className="grid gap-4">
        {attempts.map((attempt) => {
          // Compute total marks for this quiz attempt (from loaded question details)
          const totalMarks =
            attempt.quiz?.questions?.reduce((sum, qid) => {
              const q = questions[qid];
              return sum + (q ? Number(q.marks) : 0);
            }, 0) || 0;
          return (
            <div key={attempt.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {attempt.quiz?.title}
                  </h3>
                  <p className="text-gray-500">
                    Completed on{" "}
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </p>
                  {/* Display the current score and total marks when details are shown */}
                  {selectedAttempt?.id === attempt.id && (
                    <p className="text-gray-500">
                      Score: {attempt.score} / {totalMarks}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {attempt.quiz && attempt.quiz.answers_released && (
                    <button
                      onClick={() =>
                        setSelectedAttempt(
                          selectedAttempt?.id === attempt.id ? null : attempt
                        )
                      }
                      className="mt-2 text-purple-600 hover:text-purple-800"
                    >
                      {selectedAttempt?.id === attempt.id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  )}
                </div>
              </div>

              {selectedAttempt?.id === attempt.id &&
                Object.keys(questions).length > 0 && (
                  <div className="mt-4 space-y-4">
                    {attempt.quiz.questions.map((questionId) => {
                      const question = questions[questionId];
                      if (!question) return null;

                      let answersData = attempt.answers;
                      if (typeof answersData === "string") {
                        try {
                          answersData = JSON.parse(answersData);
                        } catch (err) {
                          console.error("Error parsing answers:", err);
                          answersData = {};
                        }
                      }
                      const userAns = answersData[questionId] || [];

                      let correctAnswerData = question.correct_answer;
                      if (
                        typeof correctAnswerData === "string" &&
                        correctAnswerData.trim().startsWith("[")
                      ) {
                        try {
                          correctAnswerData = JSON.parse(correctAnswerData);
                        } catch (err) {
                          console.error("Error parsing correct_answer:", err);
                        }
                      }
                      const correctAnswers = (
                        Array.isArray(correctAnswerData)
                          ? correctAnswerData
                          : [correctAnswerData]
                      ).map(normalize);

                      if (
                        question.questionType === "fill" ||
                        question.questionType === "numerical"
                      ) {
                        // For fill/numerical questions, show the user's attempted answer.
                        return (
                          <div
                            key={questionId}
                            className="border rounded-lg p-4"
                          >
                            <p className="font-medium text-gray-900">
                              {question.question}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                Your Answer:{" "}
                                {userAns[0] ? userAns[0] : "No answer provided"}
                              </p>
                              <p className="text-sm text-green-600">
                                Correct Answer:{" "}
                                {Array.isArray(question.correct_answer)
                                  ? question.correct_answer[0]
                                  : question.correct_answer}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        // For multiple choice questions, show options.
                        return (
                          <div
                            key={questionId}
                            className="border rounded-lg p-4"
                          >
                            <p className="font-medium text-gray-900">
                              {question.question}
                            </p>
                            <div className="mt-2 space-y-2">
                              {question.options.map((option, index) => {
                                const normalizedOption = normalize(option);
                                const normalizedUserAns = (
                                  Array.isArray(userAns) ? userAns : [userAns]
                                ).map(normalize);

                                const isCorrect =
                                  correctAnswers.includes(normalizedOption);
                                const isSelected =
                                  normalizedUserAns.includes(normalizedOption);

                                let label = "";
                                if (isCorrect) {
                                  label = isSelected
                                    ? " (Your correct answer)"
                                    : " (correct answer)";
                                } else if (isSelected) {
                                  label = " (Your answer)";
                                }

                                const bgColor =
                                  isSelected === isCorrect
                                    ? isCorrect
                                      ? "bg-green-100"
                                      : "bg-gray-50"
                                    : isSelected
                                    ? "bg-red-100"
                                    : "bg-green-100";

                                const textColor =
                                  isSelected === isCorrect
                                    ? isCorrect
                                      ? "text-green-800"
                                      : "text-gray-700"
                                    : isSelected
                                    ? "text-red-800"
                                    : "text-green-800";

                                return (
                                  <div
                                    key={index}
                                    className={`p-2 rounded ${bgColor} ${textColor}`}
                                  >
                                    {option}
                                    {label}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JoinClass() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // const handleJoin = async (e) => {
  //   e.preventDefault();
  //   setError("");

  //   try {
  //     // Query the classes table for a matching join code
  //     const { data, error: fetchError } = await supabase
  //       .from("classes")
  //       .select("*")
  //       .eq("join_code", joinCode)
  //       .single();

  //     if (fetchError) {
  //       console.error("Error fetching class:", fetchError);
  //       setError("Invalid join code.");
  //       return;
  //     }

  //     // Assuming a join table "class_members" exists to track enrollment:
  //     // Inside handleJoin
  //     const { error: joinError } = await supabase.from("class_members").insert([
  //       {
  //         class_id: data.id,
  //         student_id: user.id,
  //       },
  //     ]);

  //     if (joinError) {
  //       console.error("Error joining class (join table):", joinError);
  //       setError(`Failed to join class. ${joinError.message}`);
  //       return;
  //     }

  //     // Redirect to the student dashboard (or class page) after successful join
  //     navigate("/student");
  //   } catch (err) {
  //     console.error(err);
  //     setError("An error occurred. Please try again.");
  //   }
  // };
const handleJoin = async (e) => {
  e.preventDefault();
  setError("");

  // Check if user exists
  if (!user) {
    setError("You must be logged in to join a class.");
    return;
  }

  try {
    // Query the classes table for a matching join code
    const { data: classData, error: fetchError } = await supabase
      .from("classes")
      .select("*")
      .eq("join_code", joinCode.trim())
      .single();

    if (fetchError || !classData) {
      console.error("Error fetching class:", fetchError);
      setError("Invalid join code.");
      return;
    }

    // Check if the student is already enrolled in the class
    const { data: existingMembership, error: checkError } = await supabase
      .from("class_members")
      .select("*")
      .eq("class_id", classData.id)
      .eq("student_id", user.id)
      .single();

    if (existingMembership) {
      setError("You are already enrolled in this class.");
      return;
    }
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking membership:", checkError);
      setError("An error occurred. Please try again.");
      return;
    }

    // Insert the membership record
    const { error: joinError } = await supabase.from("class_members").insert([
      {
        class_id: classData.id,
        student_id: user.id,
      },
    ]);

    if (joinError) {
      console.error("Error joining class (join table):", joinError);
      setError(`Failed to join class. ${joinError.message}`);
      return;
    }

    // Redirect to the student dashboard (or class page) after successful join
    navigate("/student");
  } catch (err) {
    console.error(err);
    setError("An error occurred. Please try again.");
  }
};

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Join Class</h2>
      {error && <div className="bg-red-200 text-red-600 p-2 mb-4">{error}</div>}
      <form onSubmit={handleJoin}>
        <label className="block text-sm font-medium mb-2">
          Enter Join Code:
        </label>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter class join code"
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
        >
          Join Class
        </button>
      </form>
    </div>
  );
}

export async function getStudentDashboardData(studentId) {
  // This example assumes you have a table named 'student_dashboard'
  // with columns: quizTitle, tab_switch_count, desktop_change_count, and studentId.
  const { data, error } = await supabase
    .from("student_dashboard")
    .select("quizTitle, tab_switch_count, desktop_change_count")
    .eq("studentId", studentId);

  if (error) {
    throw error;
  }
  // Adjust as needed: here we return the first record if available.
  return data && data.length > 0
    ? data[0]
    : { quizTitle: "", tab_switch_count: 0, desktop_change_count: 0 };
}

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          {/* <Route path="/" element={<QuizList />} /> */}
          <Route path="join" element={<JoinClass />} />
          <Route path="quiz/:quizId" element={<TakeQuiz />} />
          <Route path="history" element={<QuizHistory />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="class/:classId" element={<ClassDetails />} />
        </Routes>
      </div>
    </div>
  );
}