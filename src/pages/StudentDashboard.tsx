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
        .select("*, classes(*)")
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

function TakeQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Store answers as an array of strings per question
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (quizId && user) {
      checkPreviousAttempt();
      loadQuiz();
    }
  }, [quizId, user]);

  const checkPreviousAttempt = async () => {
    if (!user || !quizId) return;
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .single();
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
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizData) {
        setQuiz(quizData);
        // Set initial timer value in seconds
        setTimeLeft(quizData.time_limit * 60);

        // Include questionType and marks along with other fields
        const { data: questionData } = await supabase
          .from("questions")
          .select("id, question, options, correct_answer, questionType, marks")
          .in("id", quizData.questions);

        if (questionData) {
          setQuestions(questionData);
        }
      }
    } catch (err) {
      console.error("Error loading quiz:", err);
    }
  };

  // New useEffect to decrement the timer every second once the quiz is loaded.
  useEffect(() => {
    if (quiz && timeLeft !== null) {
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime !== null) {
            if (prevTime <= 1) {
              clearInterval(interval);
              // Auto-submit when time runs out
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
  }, [quiz, timeLeft !== null]);

  const handleAnswer = (option: string) => {
    const question = questions[currentQuestion];
    const qid = question.id;
    const currentAns = answers[qid] || [];

    if (question.questionType === "multiple") {
      // Toggle the option for multiple-correct questions
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
      // For single correct, replace any previous answer
      setAnswers({
        ...answers,
        [qid]: [option],
      });
    }
  };

  const handleSubmit = async () => {
    if (hasAttempted) {
      alert("You have already attempted this quiz.");
      return;
    }
    if (!quiz || !user) return;

    let score = 0;
    questions.forEach((question) => {
      const given = answers[question.id] || [];
      if (question.questionType === "multiple") {
        // Assume correct_answer is an array for multi-correct questions
        const correct = question.correct_answer; // expected to be an array
        if (
          Array.isArray(correct) &&
          given.length === correct.length &&
          given.every((ans) => correct.includes(ans))
        ) {
          score++;
        }
      } else {
        // For single correct questions, correct_answer is a string
        if (given[0] === question.correct_answer) {
          score++;
        }
      }
    });

    const finalScore = Math.round((score / questions.length) * 100);

    try {
      const { error } = await supabase.from("quiz_attempts").insert([
        {
          quiz_id: quiz.id,
          user_id: user.id,
          score: finalScore,
          answers, // stores an object mapping question ids to arrays of answers
          completed_at: new Date(),
        },
      ]);
      if (error) throw error;
      navigate("/student/history");
    } catch (error) {
      console.error("Error submitting quiz:", error);
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
          <div className="flex items-center gap-2 text-purple-600">
            <Clock className="w-5 h-5" />
            {minutes}:{seconds.toString().padStart(2, "0")}
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
          {question.options.map((option, index) => {
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
          })}
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
        .select("id, question, options, correct_answer, questionType")
        .in("id", questionIds);
      if (error) throw error;
      if (data) {
        const questionMap = data.reduce((acc, q) => {
          acc[q.id] = q;
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
        {attempts.map((attempt) => (
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

                    // Parse the answers if they are stored as a JSON string.
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

                    // Determine if the question is multi-correct
                    const isMulti =
                      question.questionType === "multiple" 

                    // Normalize correct answers once for comparison.
                    let correctAnswers = [];
                    if (isMulti) {
                      correctAnswers = Array.isArray(question.correct_answer)
                        ? question.correct_answer.map((ans) =>
                            ans.trim().toLowerCase()
                          )
                        : String(question.correct_answer)
                            .split(",")
                            .map((ans) => ans.trim().toLowerCase());
                    } else {
                      correctAnswers = [
                        String(question.correct_answer).trim().toLowerCase(),
                      ];
                    }
                    return (
                      <div key={questionId} className="border rounded-lg p-4">
                        <p className="font-medium text-gray-900">
                          {question.question}
                        </p>
                        <div className="mt-2 space-y-2">
                          {question.options.map((option, index) => {
                            // Normalize the option text for consistent comparison.
                            const normalizedOption = option
                              .trim()
                              .toLowerCase();

                            // Ensure that userAns is an array.
                            const userAnsArray = Array.isArray(userAns)
                              ? userAns
                              : [userAns];
                            const normalizedUserAns = userAnsArray.map((ans) =>
                              ans.trim().toLowerCase()
                            );

                            // Check if this option is the correct answer.
                            const isCorrect =
                              correctAnswers.includes(normalizedOption);
                            // Check if the user selected this option.
                            const isSelected =
                              normalizedUserAns.includes(normalizedOption);

                            // Set the label based on the selection and correctness.
                            let label = "";
                            if (isCorrect) {
                              label = isSelected
                                ? " (Your answer)"
                                : " (Correct answer)";
                            } else if (isSelected) {
                              label = " (Your answer)";
                            }

                            // Determine the background and text colors.
                            // Always highlight the correct answer in green.
                            // Highlight user-selected wrong answers in red.
                            const bgColor = isCorrect
                              ? "bg-green-100"
                              : isSelected
                              ? "bg-red-100"
                              : "bg-gray-50";
                            const textColor = isCorrect
                              ? "text-green-800"
                              : isSelected
                              ? "text-red-800"
                              : "text-gray-700";

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
                  })}
                </div>
              )}
          </div>
        ))}
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