import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {GraduationCap,LogOut,Plus,List} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { FaChalkboard } from "react-icons/fa";
import { PlusCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { Edit, Trash2 } from "react-feather";
import { FileText } from "lucide-react";
import { getStudentDashboardData } from "./StudentDashboard";
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
          to="/teacher/question-bank"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
        >
          <FileText className="w-5 h-5" />
          Question Bank
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

function ClassMembers() {
  const { classId } = useParams<{ classId: string }>();
  const [members, setMembers] = useState<
    { id: string; student_id: string; profiles: { username: string } }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<
    Record<
      string,
      { totalTabSwitches: number; totalDesktopChanges: number } | undefined
    >
  >({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("class_members")
          .select("id, student_id, profiles(username)")
          .eq("class_id", classId);
        if (error) {
          console.error("Error loading class members:", error);
        } else {
          setMembers(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      loadMembers();
    }
  }, [classId]);

  // Once members are loaded, fetch dashboard metrics for each student.
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      const metricsMap: Record<
        string,
        { totalTabSwitches: number; totalDesktopChanges: number }
      > = {};
      await Promise.all(
        members.map(async (member) => {
          try {
            const data = await getStudentDashboardData(member.student_id);
            metricsMap[member.student_id] = data;
          } catch (err) {
            console.error(
              `Error fetching dashboard data for student ${member.student_id}:`,
              err
            );
          }
        })
      );
      setDashboardMetrics(metricsMap);
    };

    if (members.length > 0) {
      fetchDashboardMetrics();
    }
  }, [members]);

  if (loading) return <div className="p-6">Loading members...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Class Members ({members.length})
      </h2>
      {members.length === 0 ? (
        <p>No members have joined this class yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            // Get dashboard metrics for the student if available.
            const metrics = dashboardMetrics[member.student_id];
            // Calculate total switches.
            const totalSwitches = metrics
              ? metrics.totalTabSwitches + metrics.totalDesktopChanges
              : 0;
            // If totalSwitches is greater than 3, apply a red background with white text to the entire list item.
            const liClass =
              totalSwitches > 3
                ? "bg-red-500 text-white"
                : "bg-white text-gray-900";
            return (
              <li
                key={member.id}
                className={`p-3 rounded shadow flex flex-col gap-2 ${liClass}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    {member.profiles?.username || member.student_id}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/teacher/students/${member.student_id}/details`
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/teacher/students/${member.student_id}/report`
                        )
                      }
                      className="bg-green-600 text-white px-4 py-1 rounded-md hover:bg-green-700"
                    >
                      View Marks
                    </button>
                  </div>
                </div>
                {metrics && (
                  <div className="text-sm">
                    <p>
                      <strong>Tab Switches:</strong> {metrics.totalTabSwitches}
                    </p>
                    <p>
                      <strong>Desktop Changes:</strong>{" "}
                      {metrics.totalDesktopChanges}
                    </p>
                    <p>
                      <strong>Total Switches:</strong> {totalSwitches}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


interface Attempt {
  score: number;
  quiz: {
    title: string;
    total_marks: number;
  };
}

// function StudentReport() {
//   const { studentId } = useParams<{ studentId: string }>();
//   const navigate = useNavigate(); // For routing back
//   const [attempts, setAttempts] = useState<Attempt[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [report, setReport] = useState({
//     totalQuizzes: 0,
//     totalScore: 0,
//     averageScore: 0,
//   });

//   useEffect(() => {
//     if (studentId) {
//       loadStudentReport();
//     }
//   }, [studentId]);

//   const loadStudentReport = async () => {
//     try {
//       // Query quiz_attempts for this student, including the quiz details: title and questions.
//       const { data, error } = await supabase
//         .from("quiz_attempts")
//         .select("score, quiz:quizzes(title, questions)")
//         .eq("user_id", studentId);
//       if (error) {
//         console.error("Error fetching attempts:", error);
//       } else {
//         const attemptsData = data || [];

//         // For each attempt, fetch the questions and compute the total marks.
//         const attemptsWithTotalMarks = await Promise.all(
//           attemptsData.map(async (attempt: any) => {
//             let questionIds = attempt.quiz.questions;
//             // If the questions field is a string, parse it.
//             if (typeof questionIds === "string") {
//               try {
//                 questionIds = JSON.parse(questionIds);
//               } catch (e) {
//                 console.error("Error parsing quiz questions", e);
//                 questionIds = [];
//               }
//             }
//             if (questionIds && questionIds.length > 0) {
//               // Fetch the marks for all questions in this quiz.
//               const { data: questionsData, error: questionsError } =
//                 await supabase
//                   .from("questions")
//                   .select("marks")
//                   .in("id", questionIds);
//               if (questionsError) {
//                 console.error(
//                   "Error fetching questions for quiz",
//                   questionsError
//                 );
//                 return { ...attempt, total_marks: 0 };
//               }
//               // Sum the marks.
//               const total_marks = questionsData.reduce(
//                 (sum: number, q: any) => sum + Number(q.marks || 0),
//                 0
//               );
//               return { ...attempt, total_marks };
//             } else {
//               return { ...attempt, total_marks: 0 };
//             }
//           })
//         );
//         setAttempts(attemptsWithTotalMarks);

//         // Compute overall report stats.
//         const totalQuizzes = attemptsWithTotalMarks.length;
//         const totalScore = attemptsWithTotalMarks.reduce(
//           (sum: number, attempt: any) => sum + attempt.score,
//           0
//         );
//         const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
//         setReport({ totalQuizzes, totalScore, averageScore });
//       }
//     } catch (err) {
//       console.error("Error loading student report:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="p-6">Loading report...</div>;

//   return (
//     <div className="relative min-h-screen p-6 bg-gray-100">
//       {/* Back Button positioned at the top right */}
//       <button
//         onClick={() => navigate(-1)}
//         className="absolute top-4 right-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
//       >
//         Back
//       </button>

//       {/* Student Report Content */}
//       <div className="max-w-3xl mx-auto mt-16">
//         <h2 className="text-2xl font-bold mb-4">Student Report</h2>
//         <div className="mb-4">
//           <p className="text-lg">
//             <strong>Total Quizzes Taken:</strong> {report.totalQuizzes}
//           </p>
//           <p className="text-lg">
//             <strong>Average Score:</strong> {report.averageScore.toFixed(1)}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-lg shadow">
//           <h3 className="text-xl font-semibold mb-2">Quiz Attempts</h3>
//           {attempts.length === 0 ? (
//             <p>No quiz attempts found for this student.</p>
//           ) : (
//             <ul className="space-y-2">
//               {attempts.map((attempt, idx) => (
//                 <li key={idx} className="border p-2 rounded">
//                   <p>
//                     <strong>Quiz:</strong> {attempt.quiz.title}
//                   </p>
//                   <p>
//                     <strong>Score:</strong> {attempt.score} /{" "}
//                     {attempt.total_marks}
//                   </p>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

interface MemberData {
  user_id: string;
  name: string;
  totalSwitches: number;
}

function ClassMembersList() {
  // Assume the classId is passed via URL param. Adjust as needed.
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (classId) {
      fetchClassMembers(classId);
    }
  }, [classId]);

  const fetchClassMembers = async (classId: string) => {
    try {
      setLoading(true);

      // 1. Fetch all members of this class along with their user data (including name).
      //    Adjust the .select() fields based on how your tables are structured.
      const { data: classMembersData, error: classMembersError } =
        await supabase
          .from("class_members")
          .select("user_id, user:users(name)")
          .eq("class_id", classId);

      if (classMembersError) {
        console.error("Error fetching class members:", classMembersError);
        return;
      }

      if (!classMembersData) {
        setMembers([]);
        return;
      }

      // 2. For each member, fetch total tab + desktop switches from quiz_attempts.
      //    You could do this in multiple queries or in a single query using RPC / custom SQL.
      const updatedMembers: MemberData[] = [];

      for (const row of classMembersData) {
        const { user_id, user } = row;

        // Query quiz_attempts to get all attempts for this user.
        const { data: attemptsData, error: attemptsError } = await supabase
          .from("quiz_attempts")
          .select("tab_switch_count, desktop_change_count")
          .eq("user_id", user_id);

        if (attemptsError) {
          console.error("Error fetching quiz_attempts:", attemptsError);
          continue;
        }

        // Sum up the total switches for this user.
        const totalSwitches = (attemptsData || []).reduce((sum, attempt) => {
          const tabSwitches = attempt.tab_switch_count || 0;
          const desktopChanges = attempt.desktop_change_count || 0;
          return sum + tabSwitches + desktopChanges;
        }, 0);

        updatedMembers.push({
          user_id,
          name: user?.name || "Unknown",
          totalSwitches,
        });
      }

      setMembers(updatedMembers);
    } catch (err) {
      console.error("Unexpected error fetching class members:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-600">Loading class members...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Class Members ({members.length})
      </h2>
      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.user_id}
            className="flex items-center justify-between p-2 bg-white rounded shadow"
          >
            {/* Highlight name in red background if totalSwitches >= 4 */}
            <span
              className="font-semibold px-2 py-1 rounded"
              style={{
                backgroundColor:
                  member.totalSwitches >= 4 ? "red" : "transparent",
                color: member.totalSwitches >= 4 ? "white" : "inherit",
              }}
            >
              {member.name}
            </span>

            <div className="space-x-2">
              <button
                onClick={() =>
                  navigate(`/some-route/details/${member.user_id}`)
                }
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
              >
                View Details
              </button>
              <button
                onClick={() => navigate(`/some-route/marks/${member.user_id}`)}
                className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
              >
                View Marks
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface QuizDashboardData {
  quiz_id: string;
  title: string;
  totalTabSwitches: number;
  totalDesktopChanges: number;
}

function StudentDashboardDetails() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<QuizDashboardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchDashboardDetails = async () => {
      try {
        // Query quiz_attempts for the student to get quiz_id, tab_switch_count and desktop_change_count.
        const { data: attemptsData, error } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, tab_switch_count, desktop_change_count")
          .eq("user_id", studentId);
        if (error) throw error;

        // Group attempts by quiz_id, summing up the counts.
        const grouped = (attemptsData || []).reduce(
          (
            acc: Record<
              string,
              { totalTabSwitches: number; totalDesktopChanges: number }
            >,
            row: any
          ) => {
            const quizId = row.quiz_id;
            if (!acc[quizId]) {
              acc[quizId] = { totalTabSwitches: 0, totalDesktopChanges: 0 };
            }
            acc[quizId].totalTabSwitches += row.tab_switch_count || 0;
            acc[quizId].totalDesktopChanges += row.desktop_change_count || 0;
            return acc;
          },
          {}
        );

        const quizIds = Object.keys(grouped);
        if (quizIds.length === 0) {
          setDashboardData([]);
          return;
        }

        // Query the quizzes table to get quiz titles for these quiz IDs.
        const { data: quizzesData, error: quizError } = await supabase
          .from("quizzes")
          .select("id, title")
          .in("id", quizIds);
        if (quizError) throw quizError;

        const finalData: QuizDashboardData[] = (quizzesData || []).map(
          (quiz: any) => ({
            quiz_id: quiz.id,
            title: quiz.title,
            totalTabSwitches: grouped[quiz.id]?.totalTabSwitches || 0,
            totalDesktopChanges: grouped[quiz.id]?.totalDesktopChanges || 0,
          })
        );
        setDashboardData(finalData);
      } catch (err) {
        console.error("Error fetching dashboard details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Loading dashboard details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-block bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
      >
        Back
      </button>
      <h2 className="text-3xl font-bold mb-6 text-center">
        Student Dashboard Details
      </h2>
      {dashboardData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 text-left">Quiz Title</th>
                <th className="py-2 px-4 text-left">Total Tab Switches</th>
                <th className="py-2 px-4 text-left">Total Desktop Changes</th>
                <th className="py-2 px-4 text-left">Total Switches</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.map((item) => {
                // Calculate total switches for each quiz.
                const totalSwitches =
                  item.totalTabSwitches + item.totalDesktopChanges;
                // If total switches > 3, apply red background to the row.
                const rowClass = totalSwitches > 3 ? "bg-red-100" : "";
                return (
                  <tr key={item.quiz_id} className={`border-t ${rowClass}`}>
                    <td className="py-2 px-4">{item.title}</td>
                    <td className="py-2 px-4">{item.totalTabSwitches}</td>
                    <td className="py-2 px-4">{item.totalDesktopChanges}</td>
                    <td className="py-2 px-4">{totalSwitches}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No dashboard data available.
        </p>
      )}
    </div>
  );
}

// function StudentDashboardDetails() {
//   const { studentId } = useParams<{ studentId: string }>();
//   const navigate = useNavigate();
//   const [dashboardData, setDashboardData] = useState<QuizDashboardData[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!studentId) return;
//     const fetchDashboardDetails = async () => {
//       try {
//         // Query quiz_attempts for the student to get quiz_id, tab_switch_count and desktop_change_count.
//         const { data: attemptsData, error } = await supabase
//           .from("quiz_attempts")
//           .select("quiz_id, tab_switch_count, desktop_change_count")
//           .eq("user_id", studentId);
//         if (error) throw error;

//         // Group attempts by quiz_id, summing up the counts.
//         const grouped = (attemptsData || []).reduce(
//           (
//             acc: Record<
//               string,
//               { totalTabSwitches: number; totalDesktopChanges: number }
//             >,
//             row: any
//           ) => {
//             const quizId = row.quiz_id;
//             if (!acc[quizId]) {
//               acc[quizId] = { totalTabSwitches: 0, totalDesktopChanges: 0 };
//             }
//             acc[quizId].totalTabSwitches += row.tab_switch_count || 0;
//             acc[quizId].totalDesktopChanges += row.desktop_change_count || 0;
//             return acc;
//           },
//           {}
//         );

//         const quizIds = Object.keys(grouped);
//         if (quizIds.length === 0) {
//           setDashboardData([]);
//           return;
//         }

//         // Query the quizzes table to get quiz titles for these quiz IDs.
//         const { data: quizzesData, error: quizError } = await supabase
//           .from("quizzes")
//           .select("id, title")
//           .in("id", quizIds);
//         if (quizError) throw quizError;

//         const finalData: QuizDashboardData[] = (quizzesData || []).map(
//           (quiz: any) => ({
//             quiz_id: quiz.id,
//             title: quiz.title,
//             totalTabSwitches: grouped[quiz.id]?.totalTabSwitches || 0,
//             totalDesktopChanges: grouped[quiz.id]?.totalDesktopChanges || 0,
//           })
//         );
//         setDashboardData(finalData);
//       } catch (err) {
//         console.error("Error fetching dashboard details:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardDetails();
//   }, [studentId]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <p className="text-xl text-gray-600">Loading dashboard details...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <button
//         onClick={() => navigate(-1)}
//         className="mb-4 inline-block bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
//       >
//         Back
//       </button>
//       <h2 className="text-3xl font-bold mb-6 text-center">
//         Student Dashboard Details
//       </h2>
//       {dashboardData.length > 0 ? (
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white border border-gray-200 rounded-lg">
//             <thead>
//               <tr className="bg-gray-200">
//                 <th className="py-2 px-4 text-left">Quiz Title</th>
//                 <th className="py-2 px-4 text-left">Total Tab Switches</th>
//                 <th className="py-2 px-4 text-left">Total Desktop Changes</th>
//               </tr>
//             </thead>
//             <tbody>
//               {dashboardData.map((item) => (
//                 <tr key={item.quiz_id} className="border-t">
//                   <td className="py-2 px-4">{item.title}</td>
//                   <td className="py-2 px-4">{item.totalTabSwitches}</td>
//                   <td className="py-2 px-4">{item.totalDesktopChanges}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <p className="text-center text-gray-500">
//           No dashboard data available.
//         </p>
//       )}
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
          name: newClassName.trim().toLowerCase(), // store class name in lowercase
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

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id)
        .eq("created_by", user.id);

      if (error) throw error;
      setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== id));
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

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
            <div className="flex justify-end items-center mt-4 gap-4">
              <p className="text-gray-500">Class Code: {cls.join_code}</p>
              <button
                onClick={() => navigate(`/teacher/classes/${cls.id}/members`)}
                className="text-blue-600 hover:text-blue-800"
              >
                View Members
              </button>
              <button
                onClick={() => handleDeleteClass(cls.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
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

  // Updated newQuestion state to include additional types
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: [] as string[],
    difficulty: "medium" as "easy" | "medium" | "hard",
    questionType: "single" as "single" | "multiple" | "numerical" | "fill",
    marks: "", // New field for marks allotment
  });

  // Update editingQuestion state type if needed.
  const [editingQuestion, setEditingQuestion] = useState<
    | (Question & {
        questionType: "single" | "multiple" | "numerical" | "fill";
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

  // Adjusted loadQuestions to work with category (using class details if needed)
  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("category", classId); // or adjust based on your data model
      if (error) throw error;
      const formattedQuestions = data.map((question) => ({
        ...question,
        options: JSON.parse(question.options || "[]"), // Ensure options are parsed
        correct_answer: JSON.parse(question.correct_answer || "[]"), // Parse correct answers too
      }));
      setQuestions(formattedQuestions);
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
      // For single or multiple, ensure all option fields are filled
      ((newQuestion.questionType === "single" ||
        newQuestion.questionType === "multiple") &&
        newQuestion.options.some((opt) => !opt.trim())) ||
      !newQuestion.marks ||
      (newQuestion.questionType === "single" &&
        (!newQuestion.correct_answer[0] ||
          !newQuestion.correct_answer[0].trim())) ||
      (newQuestion.questionType === "multiple" &&
        newQuestion.correct_answer.length === 0) ||
      ((newQuestion.questionType === "numerical" ||
        newQuestion.questionType === "fill") &&
        (!newQuestion.correct_answer[0] ||
          !newQuestion.correct_answer[0].trim()))
    ) {
      alert(
        "Please fill in all fields and select at least one correct answer."
      );
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
          // For single/multiple, store options; otherwise, send null
          options:
            newQuestion.questionType === "single" ||
            newQuestion.questionType === "multiple"
              ? JSON.stringify(newQuestion.options)
              : null,
          correct_answer: JSON.stringify(newQuestion.correct_answer),
          marks: parseInt(newQuestion.marks, 10),
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
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
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
          options:
            editingQuestion.questionType === "single" ||
            editingQuestion.questionType === "multiple"
              ? JSON.stringify(editingQuestion.options)
              : null,
          correct_answer: JSON.stringify(editingQuestion.correct_answer),
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
      | "numerical"
      | "fill"
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

              {/* Choose Question Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Question Type
                </label>
                <select
                  value={newQuestion.questionType}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionType: e.target.value as
                        | "single"
                        | "multiple"
                        | "numerical"
                        | "fill",
                      correct_answer: [],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="single">Single Correct Answer</option>
                  <option value="multiple">Multiple Correct Answers</option>
                  <option value="numerical">Numerical</option>
                  <option value="fill">Fill in the Blank</option>
                </select>
              </div>

              {/* Render Options or Answer Input Conditionally */}
              {(newQuestion.questionType === "single" ||
                newQuestion.questionType === "multiple") && (
                <>
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
                    // For multiple correct answers
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Correct Answers
                      </label>
                      {newQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 mb-2"
                        >
                          <input
                            type="checkbox"
                            checked={newQuestion.correct_answer.includes(
                              option
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  correct_answer: [
                                    ...prev.correct_answer,
                                    option,
                                  ],
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
                </>
              )}

              {(newQuestion.questionType === "numerical" ||
                newQuestion.questionType === "fill") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Answer
                  </label>
                  <input
                    type="text"
                    value={newQuestion.correct_answer[0] || ""}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correct_answer: [e.target.value],
                      })
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
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
                      e.target.value as
                        | "single"
                        | "multiple"
                        | "numerical"
                        | "fill"
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="single">Single Correct Answer</option>
                  <option value="multiple">Multiple Correct Answers</option>
                  <option value="numerical">Numerical</option>
                  <option value="fill">Fill in the Blank</option>
                </select>
              </div>

              {editingQuestion.questionType === "single" ||
              editingQuestion.questionType === "multiple" ? (
                <>
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
                          handleEditFieldChange("correct_answer", [
                            e.target.value,
                          ])
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
                    // For multiple correct answers
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Correct Answers
                      </label>
                      {editingQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 mb-2"
                        >
                          <input
                            type="checkbox"
                            checked={editingQuestion.correct_answer.includes(
                              option
                            )}
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
                </>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Answer
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.correct_answer[0] || ""}
                    onChange={(e) =>
                      handleEditFieldChange("correct_answer", [e.target.value])
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
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
              {(question.questionType === "single" ||
                question.questionType === "multiple") && (
                <ul className="mt-2 list-disc pl-5">
                  {question.options.map((option, idx) => (
                    <li key={idx}>{option}</li>
                  ))}
                </ul>
              )}
              {(question.questionType === "numerical" ||
                question.questionType === "fill") && (
                <p className="mt-2 text-sm">
                  Answer:{" "}
                  {Array.isArray(question.correct_answer)
                    ? question.correct_answer[0]
                    : question.correct_answer}
                </p>
              )}
              <p className="mt-2 text-sm text-green-600">
                Correct Answer:{" "}
                {Array.isArray(question.correct_answer)
                  ? question.correct_answer.join(", ")
                  : question.correct_answer}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Difficulty: {question.difficulty} | Marks: {question.marks}
              </p>
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

function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [numQuestions, setNumQuestions] = useState(1);
  // Updated: categories now holds objects with name and description
  const [categories, setCategories] = useState<
    { name: string; description: string }[]
  >([]);
  const [category, setCategory] = useState(""); // The subject/category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Distinct mark values for the chosen subject:
  const [markSections, setMarkSections] = useState<number[]>([]);
  // Teacher input for how many questions they want at each mark:
  const [questionsByMark, setQuestionsByMark] = useState<{
    [key: number]: number;
  }>({});

  // Teacher input for how many easy, medium, hard questions:
  const [questionsByDifficulty, setQuestionsByDifficulty] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // 1) Fetch possible subjects along with their descriptions
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("classes")
        .select("name, description")
        .eq("created_by", user.id);

      if (!error && data) {
        setCategories(data);
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
      const { data: intersectionData, error: intersectionError } =
        await supabase
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
          `Not enough questions that satisfy your difficulty + mark constraints. Need ${numQuestions}, found ${
            intersectionData?.length || 0
          }.`
        );
      }

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

      if (finalIDs.length !== numQuestions) {
        throw new Error(
          `Could not allocate enough questions to satisfy the exact difficulty+mark distribution. Picked ${finalIDs.length}, but needed ${numQuestions}.`
        );
      }

      // Insert quiz
      const { error: quizError } = await supabase.from("quizzes").insert([
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
              <option key={cat.name} value={cat.name}>
                {cat.name} - {cat.description}
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

function QuestionBank() {
  const user = useAuthStore((state) => state.user);
  const [classes, setClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [editMode, setEditMode] = useState(null);
  // currentPage can be: "subject", "list", "type", or "form"
  const [currentPage, setCurrentPage] = useState("subject");

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: [],
    questionType: "single",
    difficulty: "medium",
    marks: "",
  });

  useEffect(() => {
    if (user) loadClasses();
  }, [user]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("name")
        .eq("created_by", user?.id);
      if (error) throw error;
      const uniqueSubjects = [...new Set(data.map((cls) => cls.name))];
      setClasses(uniqueSubjects);
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("category", selectedSubject);
      if (error) throw error;
      const formattedQuestions = data.map((question) => ({
        ...question,
        options:
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : question.options,
        correct_answer:
          typeof question.correct_answer === "string"
            ? JSON.parse(question.correct_answer)
            : question.correct_answer,
      }));
      setQuestions(formattedQuestions);
    } catch (err) {
      console.error("Error loading questions:", err);
    }
  };

  const handleInsertQuestion = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert("Please select a subject first.");
      return;
    }
    try {
      const { error } = await supabase.from("questions").insert([
        {
          created_by: user.id,
          question: newQuestion.question.trim(),
          // For types numerical or fill, use an empty array instead of null
          options:
            newQuestion.questionType === "single" ||
            newQuestion.questionType === "multiple"
              ? JSON.stringify(newQuestion.options)
              : JSON.stringify([]),
          correct_answer: JSON.stringify(newQuestion.correct_answer),
          questionType: newQuestion.questionType,
          difficulty: newQuestion.difficulty,
          marks: parseInt(newQuestion.marks, 10),
          category: selectedSubject,
        },
      ]);
      if (error) throw error;
      alert("Question successfully added.");
      resetForm();
      loadQuestions();
      setCurrentPage("list");
    } catch (err) {
      console.error("Error inserting question:", err);
      alert("Failed to add question. Please try again.");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      alert("Question deleted successfully.");
      loadQuestions();
    } catch (err) {
      console.error("Error deleting question:", err);
      alert("Failed to delete question. Please try again.");
    }
  };

  const handleEditQuestion = (id) => {
    const updatedQuestion = questions.find((q) => q.id === id);
    setNewQuestion({
      question: updatedQuestion.question,
      options: updatedQuestion.options || ["", "", "", ""],
      correct_answer: updatedQuestion.correct_answer,
      questionType: updatedQuestion.questionType,
      difficulty: updatedQuestion.difficulty,
      marks: updatedQuestion.marks ? updatedQuestion.marks.toString() : "",
    });
    setEditMode(id);
    setCurrentPage("form");
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!editMode) return;
    try {
      const { error } = await supabase
        .from("questions")
        .update({
          question: newQuestion.question.trim(),
          options:
            newQuestion.questionType === "single" ||
            newQuestion.questionType === "multiple"
              ? JSON.stringify(newQuestion.options)
              : JSON.stringify([]), // Changed from null to JSON.stringify([])
          correct_answer: JSON.stringify(newQuestion.correct_answer),
          questionType: newQuestion.questionType,
          difficulty: newQuestion.difficulty,
          marks: parseInt(newQuestion.marks, 10),
        })
        .eq("id", editMode);
      if (error) throw error;
      alert("Question updated successfully.");
      resetForm();
      loadQuestions();
      setCurrentPage("list");
    } catch (err) {
      console.error("Error updating question:", err);
      alert("Failed to update question. Please try again.");
    }
  };

  const resetForm = () => {
    setEditMode(null);
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correct_answer: [],
      questionType: "single",
      difficulty: "medium",
      marks: "",
    });
  };

  // Render based on currentPage
  if (currentPage === "subject") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Select Subject</h2>
        <div className="mb-4">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select a subject</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (!selectedSubject) {
              alert("Please select a subject.");
            } else {
              loadQuestions();
              setCurrentPage("list");
            }
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Continue
        </button>
      </div>
    );
  } else if (currentPage === "list") {
    return (
      <div className="p-6 relative">
        <h2 className="text-2xl font-bold mb-4">
          Questions for {selectedSubject}
        </h2>
        <button
          onClick={() => setCurrentPage("type")}
          className="absolute top-6 right-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add Question
        </button>
        {questions.length === 0 ? (
          <p>No questions available for this subject.</p>
        ) : (
          <ul className="space-y-4">
            {questions.map((question) => (
              <li
                key={question.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <p className="font-semibold">{question.question}</p>
                {(question.questionType === "single" ||
                  question.questionType === "multiple") && (
                  <ul className="mt-2 list-disc pl-5">
                    {question.options.map((option, idx) => (
                      <li key={idx}>{option}</li>
                    ))}
                  </ul>
                )}
                {(question.questionType === "numerical" ||
                  question.questionType === "fill") && (
                  <p className="mt-2 text-sm">
                    Answer:{" "}
                    {Array.isArray(question.correct_answer)
                      ? question.correct_answer[0]
                      : question.correct_answer}
                  </p>
                )}
                <p className="mt-2 text-sm text-green-600">
                  Correct Answer:{" "}
                  {Array.isArray(question.correct_answer)
                    ? question.correct_answer.join(", ")
                    : question.correct_answer}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Difficulty: {question.difficulty} | Marks: {question.marks}
                </p>
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(question.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setCurrentPage("subject")}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Back to Subjects
        </button>
      </div>
    );
  } else if (currentPage === "type") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Select Question Type</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setNewQuestion({ ...newQuestion, questionType: "single" });
              setCurrentPage("form");
            }}
            className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Single Correct Answer
          </button>
          <button
            onClick={() => {
              setNewQuestion({ ...newQuestion, questionType: "multiple" });
              setCurrentPage("form");
            }}
            className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Multiple Correct Answers
          </button>
          <button
            onClick={() => {
              setNewQuestion({ ...newQuestion, questionType: "numerical" });
              setCurrentPage("form");
            }}
            className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Numerical
          </button>
          <button
            onClick={() => {
              setNewQuestion({ ...newQuestion, questionType: "fill" });
              setCurrentPage("form");
            }}
            className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Fill in the Blank
          </button>
        </div>
        <button
          onClick={() => setCurrentPage("list")}
          className="mt-4 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    );
  } else if (currentPage === "form") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {editMode ? "Edit Question" : "Add Question"} (
          {newQuestion.questionType.charAt(0).toUpperCase() +
            newQuestion.questionType.slice(1)}
          )
        </h2>
        <form onSubmit={editMode ? handleUpdateQuestion : handleInsertQuestion}>
          <label className="block mb-2">Question:</label>
          <textarea
            value={newQuestion.question}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, question: e.target.value })
            }
            required
            className="block w-full p-2 border border-gray-300 rounded mb-4"
          />

          <label className="block mb-2">Difficulty:</label>
          <select
            value={newQuestion.difficulty}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, difficulty: e.target.value })
            }
            className="block w-full p-2 border border-gray-300 rounded mb-4"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <label className="block mb-2">Marks:</label>
          <input
            type="number"
            value={newQuestion.marks}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, marks: e.target.value })
            }
            required
            className="block w-full p-2 border border-gray-300 rounded mb-4"
          />

          {newQuestion.questionType === "single" ||
          newQuestion.questionType === "multiple" ? (
            <>
              <label className="block mb-2">Options:</label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="mb-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updatedOptions = [...newQuestion.options];
                      updatedOptions[idx] = e.target.value;
                      setNewQuestion({
                        ...newQuestion,
                        options: updatedOptions,
                      });
                    }}
                    required
                    className="block w-full p-2 border border-gray-300 rounded"
                  />
                  <div className="flex items-center mt-1">
                    {newQuestion.questionType === "single" ? (
                      <input
                        type="radio"
                        name="correctOption"
                        value={newQuestion.options[idx]}
                        checked={
                          newQuestion.correct_answer[0] ===
                          newQuestion.options[idx]
                        }
                        onChange={() =>
                          setNewQuestion({
                            ...newQuestion,
                            correct_answer: [newQuestion.options[idx]],
                          })
                        }
                      />
                    ) : (
                      <input
                        type="checkbox"
                        value={newQuestion.options[idx]}
                        checked={newQuestion.correct_answer.includes(
                          newQuestion.options[idx]
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewQuestion({
                              ...newQuestion,
                              correct_answer: [
                                ...newQuestion.correct_answer,
                                newQuestion.options[idx],
                              ],
                            });
                          } else {
                            setNewQuestion({
                              ...newQuestion,
                              correct_answer: newQuestion.correct_answer.filter(
                                (ans) => ans !== newQuestion.options[idx]
                              ),
                            });
                          }
                        }}
                      />
                    )}
                    <span className="ml-2 text-sm">Mark as correct</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="mb-4">
              <label className="block mb-2">Answer:</label>
              <input
                type="text"
                value={newQuestion.correct_answer[0] || ""}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    correct_answer: [e.target.value],
                  })
                }
                required
                className="block w-full p-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className={`bg-${
                editMode ? "blue" : "purple"
              }-600 text-white px-4 py-2 rounded-md hover:bg-${
                editMode ? "blue" : "purple"
              }-700`}
            >
              {editMode ? "Update Question" : "Add Question"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setCurrentPage("list");
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
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
    const { data, error } = await supabase
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
      loadQuizzes();
    }
  };

  // New function to release the entire quiz
  const handleReleaseQuiz = async (id: string) => {
    const { error } = await supabase
      .from("quizzes")
      .update({ release_quiz: true })
      .eq("id", id);

    if (error) {
      console.error("Error releasing quiz:", error);
    } else {
      alert("Quiz released successfully!");
      loadQuizzes();
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
                <button
                  onClick={() => handleReleaseQuiz(quiz.id)}
                  className="text-green-600 hover:text-green-800"
                >
                  Release Quiz
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
          <Route path="/" element={<Navigate to="/teacher/classes" replace />}/>
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassQuestions />} />
          <Route path="/classes/:classId/members" element={<ClassMembers />} />
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quizzes/create" element={<CreateQuiz />} />
          <Route path="/students/:studentId/report" element={<ClassMembersList />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/students/:studentId/details" element={<StudentDashboardDetails />}/>
        </Routes>
      </div>
    </div>
  );
}
