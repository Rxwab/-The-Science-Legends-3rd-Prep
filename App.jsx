import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore';

// Hardcoded questions for 3rd-year middle school science in Arabic
const questionsData = [
  {
    question: "وحدة قياس السرعة هي؟",
    options: ["متر", "متر/ثانية", "ثانية", "كيلومتر"],
    answer: "متر/ثانية"
  },
  {
    question: "السرعة المنتظمة هي السرعة التي يقطع فيها الجسم مسافات متساوية في أزمنة؟",
    options: ["متساوية", "غير متساوية", "كبيرة", "صغيرة"],
    answer: "متساوية"
  },
  {
    question: "عندما تزداد المسافة التي يقطعها الجسم في نفس الزمن، فإن السرعة؟",
    options: ["تقل", "تزداد", "تظل ثابتة", "تساوي صفر"],
    answer: "تزداد"
  },
  {
    question: "إذا تحرك جسم بسرعة 100 كم/ساعة، فهذه تعتبر سرعة؟",
    options: ["منتظمة", "متوسطة", "نسبية", "متغيرة"],
    answer: "منتظمة"
  },
  {
    question: "السرعة المتوسطة هي حاصل قسمة المسافة الكلية على؟",
    options: ["الزمن الكلي", "الزمن الأولي", "الزمن النهائي", "السرعة"],
    answer: "الزمن الكلي"
  },
  {
    question: "إذا كان الجسم ساكناً، فإن سرعته تساوي؟",
    options: ["أكبر قيمة", "أقل قيمة", "صفر", "لا يمكن تحديدها"],
    answer: "صفر"
  },
  {
    question: "السرعة النسبية لسيارة بالنسبة لمراقب ساكن تساوي؟",
    options: ["سرعة السيارة الفعلية", "صفر", "ضعف سرعة السيارة", "نصف سرعة السيارة"],
    answer: "سرعة السيارة الفعلية"
  },
  {
    question: "إذا تحرك جسم مسافة 50 متر في 10 ثواني، فما هي سرعته؟",
    options: ["5 متر/ثانية", "50 متر/ثانية", "10 متر/ثانية", "0.5 متر/ثانية"],
    answer: "5 متر/ثانية"
  },
  {
    question: "حاصل ضرب السرعة في الزمن يساوي؟",
    options: ["الزمن", "السرعة", "المسافة", "التسارع"],
    answer: "المسافة"
  },
  {
    question: "الحركة هي تغير موضع الجسم بمرور؟",
    options: ["السرعة", "الزمن", "المسافة", "القوة"],
    answer: "الزمن"
  },
  {
    question: "ما هي الحركة الانتقالية؟",
    options: ["حركة دورية", "حركة في خط مستقيم أو منحنى", "حركة اهتزازية", "حركة دائرية"],
    answer: "حركة في خط مستقيم أو منحنى"
  },
  {
    question: "إذا كانت السرعة تتغير بمرور الزمن، تسمى الحركة؟",
    options: ["سرعة منتظمة", "سرعة نسبية", "حركة متسارعة", "سرعة متوسطة"],
    answer: "حركة متسارعة"
  },
  {
    question: "ماذا يقيس عداد السرعة في السيارة؟",
    options: ["المسافة", "الزمن", "السرعة اللحظية", "السرعة المتوسطة"],
    answer: "السرعة اللحظية"
  },
  {
    question: "ما هي السرعة التي يقطع فيها الجسم مسافات غير متساوية في أزمنة متساوية؟",
    options: ["السرعة المنتظمة", "السرعة المتغيرة", "السرعة المتوسطة", "السرعة النسبية"],
    answer: "السرعة المتغيرة"
  },
  {
    question: "إذا كانت سرعة جسم تساوي صفر، فهذا يعني أن الجسم؟",
    options: ["يتحرك بسرعة ثابتة", "ساكن", "يتحرك بسرعة متزايدة", "يتحرك بسرعة متناقصة"],
    answer: "ساكن"
  },
  {
    question: "ما هو القانون الرياضي لحساب السرعة؟",
    options: ["الزمن/المسافة", "المسافة × الزمن", "المسافة + الزمن", "المسافة/الزمن"],
    answer: "المسافة/الزمن"
  },
  {
    question: "عندما يتحرك جسم بسرعة ثابتة في خط مستقيم، فإن حركته تكون؟",
    options: ["منتظمة", "متغيرة", "متسارعة", "دائرية"],
    answer: "منتظمة"
  },
  {
    question: "ما هي الحركة الدورية؟",
    options: ["حركة في خط مستقيم", "حركة تتكرر بانتظام", "حركة بطيئة", "حركة في مسار منحني"],
    answer: "حركة تتكرر بانتظام"
  },
  {
    question: "السرعة النسبية لجسمين يتحركان في نفس الاتجاه تساوي؟",
    options: ["مجموع سرعتيهما", "حاصل ضرب سرعتيهما", "الفرق بين سرعتيهما", "صفر"],
    answer: "الفرق بين سرعتيهما"
  },
  {
    question: "السرعة النسبية لجسمين يتحركان في اتجاهين متضادين تساوي؟",
    options: ["الفرق بين سرعتيهما", "حاصل ضرب سرعتيهما", "مجموع سرعتيهما", "صفر"],
    answer: "مجموع سرعتيهما"
  },
  {
    question: "يتم حساب المسافة المقطوعة عن طريق ضرب السرعة في؟",
    options: ["الزمن", "الكتلة", "الوزن", "التسارع"],
    answer: "الزمن"
  },
  {
    question: "تغير موضع الجسم بمرور الزمن يُعرف بـ؟",
    options: ["السرعة", "المسافة", "الحركة", "القوة"],
    answer: "الحركة"
  },
  {
    question: "متى تكون السرعة المتوسطة تساوي السرعة المنتظمة؟",
    options: ["دائما", "عندما يتحرك الجسم بسرعة منتظمة", "عندما يتوقف الجسم", "لا يمكن أن يحدث"],
    answer: "عندما يتحرك الجسم بسرعة منتظمة"
  },
  {
    question: "ما هو مقدار سرعة الجسم الذي يقطع مسافة 180 كم في ساعتين؟",
    options: ["90 كم/ساعة", "180 كم/ساعة", "360 كم/ساعة", "200 كم/ساعة"],
    answer: "90 كم/ساعة"
  },
  {
    question: "عندما يقف المراقب، السرعة النسبية تساوي؟",
    options: ["السرعة الفعلية", "صفر", "نصف السرعة الفعلية", "ضعف السرعة الفعلية"],
    answer: "السرعة الفعلية"
  },
  {
    question: "المسافة المقطوعة في وحدة الزمن هي تعريف؟",
    options: ["الزمن", "السرعة", "الكتلة", "التسارع"],
    answer: "السرعة"
  },
  {
    question: "السرعة القياسية هي كمية فيزيائية تحدد بـ؟",
    options: ["المقدار فقط", "الاتجاه فقط", "المقدار والاتجاه", "الزمن"],
    answer: "المقدار فقط"
  },
  {
    question: "السرعة المتجهة هي كمية فيزيائية تحدد بـ؟",
    options: ["المقدار فقط", "الاتجاه فقط", "المقدار والاتجاه", "الزمن"],
    answer: "المقدار والاتجاه"
  },
];

const shopItemsData = [
  { id: 'effect1', name: 'تأثير ذهبي', price: 50, type: 'effect' },
  { id: 'effect2', name: 'تأثير النيون', price: 75, type: 'effect' },
  { id: 'background1', name: 'خلفية فضائية', price: 100, type: 'background' },
  { id: 'background2', name: 'خلفية خشبية فاخرة', price: 120, type: 'background' },
];

// Helper function for a sleek modal
const Modal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-sm text-center">
        <p className="text-white text-lg font-bold mb-4">{message}</p>
        <button
          onClick={onClose}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
        >
          حسناً
        </button>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
  </div>
);

// CSS for name effects
const nameEffects = {
  effect1: "bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text font-extrabold",
  effect2: "text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.8)] font-bold",
};

const backgrounds = {
  background1: "bg-cover bg-center",
  background2: "bg-cover bg-center",
};

// Global variables for Firebase configuration
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firestore DB and Auth instances
  const app = React.useRef(null);
  const db = React.useRef(null);
  const auth = React.useRef(null);

  useEffect(() => {
    // Initialize Firebase and Auth State Listener
    if (Object.keys(firebaseConfig).length === 0) {
      console.error("Firebase config not available. App will not function correctly.");
      setIsAuthReady(true); // Allow UI to render even without auth
      return;
    }
    app.current = initializeApp(firebaseConfig);
    auth.current = getAuth(app.current);
    db.current = getFirestore(app.current);

    // This listener handles the initial sign-in and subsequent state changes
    const unsubscribe = onAuthStateChanged(auth.current, (authUser) => {
      // Sign in with custom token if available, otherwise sign in anonymously
      const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
      if (initialToken) {
        signInWithCustomToken(auth.current, initialToken)
          .then(() => {
            console.log('Signed in with custom token');
            setIsAuthReady(true);
          })
          .catch((error) => {
            console.error("Error signing in with custom token:", error);
            signInAnonymously(auth.current).then(() => {
              setIsAuthReady(true);
            });
          });
      } else {
        signInAnonymously(auth.current).then(() => {
          setIsAuthReady(true);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Set up real-time leaderboard listener
    if (!isAuthReady || !db.current) return;

    const leaderboardRef = collection(db.current, `artifacts/${appId}/public/data/leaderboard`);
    const q = query(leaderboardRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid Firestore index issues
      const sortedData = data.sort((a, b) => b.points - a.points).slice(0, 100);
      setLeaderboardData(sortedData);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setModalMessage("حدث خطأ أثناء تحميل لوحة الأوائل.");
      setShowModal(true);
    });

    return () => unsubscribe();
  }, [isAuthReady]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!auth.current || !db.current) {
        setModalMessage("حدث خطأ في الاتصال بالخادم. حاول مرة أخرى.");
        setShowModal(true);
        setIsLoading(false);
        return;
    }

    const userId = auth.current.currentUser?.uid || `anon-${crypto.randomUUID()}`;
    const userDocRef = doc(db.current, `artifacts/${appId}/public/data/leaderboard`, userId);
    
    try {
        const userSnap = await getDoc(userDocRef);
        let userData;
        if (userSnap.exists()) {
            userData = { ...userSnap.data(), id: userSnap.id };
        } else {
            userData = {
                id: userId,
                name: username || 'لاعب',
                age: age || 'غير محدد',
                points: 0,
                purchasedItems: [],
                appliedEffect: null,
                appliedBackground: null
            };
            await setDoc(userDocRef, userData);
        }
        setUser(userData);
        setCurrentPage('home');
    } catch (error) {
        console.error("Error during login:", error);
        setModalMessage("فشل تسجيل الدخول. حاول مجدداً.");
        setShowModal(true);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnswer = (selectedOption) => {
    const currentQuestion = questionsData[currentQuestionIndex];
    if (selectedOption === currentQuestion.answer) {
      setFeedbackMessage('إجابة صحيحة!');
      const newPoints = user.points + 10;
      updateUserPoints(newPoints);
    } else {
      setFeedbackMessage(`إجابة خاطئة. الإجابة الصحيحة هي: ${currentQuestion.answer}`);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
      if (currentQuestionIndex < questionsData.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setModalMessage(`أنهيت كل الأسئلة! نقاطك النهائية: ${user.points}`);
        setShowModal(true);
        setCurrentPage('home');
        setCurrentQuestionIndex(0); // Reset for next play
      }
    }, 1500);
  };

  const updateUserPoints = async (newPoints) => {
    if (!db.current || !user) return;
    const userDocRef = doc(db.current, `artifacts/${appId}/public/data/leaderboard`, user.id);
    try {
      await setDoc(userDocRef, { points: newPoints }, { merge: true });
      setUser(prevUser => ({ ...prevUser, points: newPoints }));
    } catch (error) {
      console.error("Error updating points:", error);
      setModalMessage("حدث خطأ في حفظ نقاطك.");
      setShowModal(true);
    }
  };

  const handlePurchase = async (item) => {
    if (!db.current || !user) return;
    if (user.points < item.price) {
      setModalMessage("نقاطك غير كافية لشراء هذا العنصر.");
      setShowModal(true);
      return;
    }

    // Check if item is already owned
    if (user.purchasedItems.includes(item.id)) {
      setModalMessage("لقد اشتريت هذا العنصر بالفعل.");
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    const userDocRef = doc(db.current, `artifacts/${appId}/public/data/leaderboard`, user.id);
    try {
      const newPoints = user.points - item.price;
      const newPurchasedItems = [...user.purchasedItems, item.id];
      await setDoc(userDocRef, { points: newPoints, purchasedItems: newPurchasedItems }, { merge: true });
      setUser(prevUser => ({
        ...prevUser,
        points: newPoints,
        purchasedItems: newPurchasedItems
      }));
      setModalMessage(`تهانينا! لقد اشتريت ${item.name}.`);
      setShowModal(true);
    } catch (error) {
      console.error("Error purchasing item:", error);
      setModalMessage("حدث خطأ في عملية الشراء.");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyItem = async (item) => {
    if (!db.current || !user || !user.purchasedItems.includes(item.id)) {
      setModalMessage("يجب عليك شراء هذا العنصر أولاً.");
      setShowModal(true);
      return;
    }

    const userDocRef = doc(db.current, `artifacts/${appId}/public/data/leaderboard`, user.id);
    try {
      if (item.type === 'effect') {
        await setDoc(userDocRef, { appliedEffect: item.id }, { merge: true });
        setUser(prevUser => ({ ...prevUser, appliedEffect: item.id, appliedBackground: null })); // Apply only one at a time
      } else if (item.type === 'background') {
        await setDoc(userDocRef, { appliedBackground: item.id }, { merge: true });
        setUser(prevUser => ({ ...prevUser, appliedBackground: item.id, appliedEffect: null })); // Apply only one at a time
      }
      setModalMessage(`تم تطبيق ${item.name} بنجاح.`);
      setShowModal(true);
    } catch (error) {
      console.error("Error applying item:", error);
      setModalMessage("حدث خطأ في تطبيق العنصر.");
      setShowModal(true);
    }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
          <LoadingSpinner />
          <p className="mt-4 text-xl">جارِ التحميل، رجاءً انتظر...</p>
        </div>
      );
    }

    // Login Page
    if (currentPage === 'login') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
          <div className="w-full max-w-lg bg-gray-900 rounded-3xl shadow-2xl p-8 transform transition-transform duration-500 hover:scale-[1.01] border border-gray-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              دخول
            </h1>
            <p className="text-center text-gray-400 mb-8">
              الرجاء إدخال اسمك وعمرك للانضمام إلى اللعبة.
            </p>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-400">الاسم</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسمك"
                  className="mt-1 block w-full rounded-xl bg-gray-800 border border-gray-700 text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-400">العمر</label>
                <input
                  type="number"
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="عمرك"
                  className="mt-1 block w-full rounded-xl bg-gray-800 border border-gray-700 text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : 'ابدأ اللعبة'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Home Page
    if (currentPage === 'home') {
      const backgroundClass = user?.appliedBackground ? backgrounds[user.appliedBackground] : '';
      const backgroundStyle = user?.appliedBackground ? { backgroundImage: `url(https://placehold.co/1920x1080/000000/FFFFFF?text=${user.appliedBackground})` } : {};
      
      const effectClass = user?.appliedEffect ? nameEffects[user.appliedEffect] : '';
      const displayName = <span className={effectClass}>{user?.name || 'مستخدم'}</span>;

      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${backgroundClass} bg-gray-950`} style={backgroundStyle}>
            <div className="text-center p-8 bg-gray-900 bg-opacity-80 rounded-3xl shadow-2xl backdrop-blur-sm border border-gray-700 w-full max-w-2xl transform transition-transform duration-500">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-600 mb-4">
                    أهلاً بك، {displayName}!
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8">
                    نقاطك الحالية: <span className="text-yellow-400 font-bold">{user?.points}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2 mb-8">
                  <span className='font-bold text-gray-400'>معرف المستخدم:</span> {user?.id}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setCurrentPage('game')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        ابدأ اللعب
                    </button>
                    <button
                        onClick={() => setCurrentPage('leaderboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        لوحة الأوائل
                    </button>
                    <button
                        onClick={() => setCurrentPage('shop')}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        المتجر
                    </button>
                </div>
            </div>
        </div>
      );
    }

    // Game Page
    if (currentPage === 'game') {
      const currentQuestion = questionsData[currentQuestionIndex];
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
          <div className="w-full max-w-3xl bg-gray-900 rounded-3xl shadow-2xl p-8 transform transition-transform duration-500 hover:scale-[1.01] border border-gray-700">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              مرحباً بك في غرفة اللعب
            </h2>
            <p className="text-lg md:text-xl text-gray-300 text-center mb-6">
              نقاطك الحالية: <span className="text-yellow-400 font-bold">{user.points}</span>
            </p>
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <p className="text-xl md:text-2xl font-semibold mb-4 text-center">
                السؤال رقم {currentQuestionIndex + 1}:
              </p>
              <p className="text-2xl md:text-3xl font-bold text-center text-white">
                {currentQuestion.question}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="bg-gray-800 text-white text-lg font-semibold py-4 px-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-indigo-600"
                >
                  {option}
                </button>
              ))}
            </div>
            {feedbackMessage && (
              <div className={`mt-6 text-center text-xl font-bold p-4 rounded-xl ${feedbackMessage.startsWith('إجابة صحيحة') ? 'bg-green-600' : 'bg-red-600'}`}>
                {feedbackMessage}
              </div>
            )}
            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentPage('home')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Leaderboard Page
    if (currentPage === 'leaderboard') {
      const getRankClass = (rank) => {
        if (rank === 1) return "text-yellow-400 text-2xl font-extrabold";
        if (rank === 2) return "text-gray-400 text-xl font-bold";
        if (rank === 3) return "text-orange-400 text-lg font-semibold";
        return "text-gray-400";
      };

      return (
        <div className="min-h-screen flex flex-col items-center bg-gray-950 text-white p-4">
          <div className="w-full max-w-3xl bg-gray-900 rounded-3xl shadow-2xl p-8 transform transition-transform duration-500 hover:scale-[1.01] border border-gray-700 mt-8 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
              لوحة الأوائل
            </h2>
            <div className="bg-gray-800 rounded-2xl p-4 overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-4 font-bold text-lg text-gray-300 p-2">
                <span className="text-center">المركز</span>
                <span className="text-center md:col-span-2">الاسم</span>
                <span className="text-center">النقاط</span>
              </div>
              <div className="space-y-2">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((player, index) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-3 md:grid-cols-4 p-3 rounded-lg transition-all duration-300 hover:bg-gray-700"
                    >
                      <span className={`text-center ${getRankClass(index + 1)}`}>#{index + 1}</span>
                      <span className="text-center font-medium truncate md:col-span-2">{player.name}</span>
                      <span className="text-center font-bold text-yellow-300">{player.points}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد بيانات حالياً. كن أول من يلعب!</p>
                )}
              </div>
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentPage('home')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Shop Page
    if (currentPage === 'shop') {
      return (
        <div className="min-h-screen flex flex-col items-center bg-gray-950 text-white p-4">
          <div className="w-full max-w-3xl bg-gray-900 rounded-3xl shadow-2xl p-8 transform transition-transform duration-500 hover:scale-[1.01] border border-gray-700 mt-8 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-500">
              متجر العناصر الفاخرة
            </h2>
            <p className="text-center text-xl text-gray-300 mb-8">
              نقاطك: <span className="text-yellow-400 font-bold">{user.points}</span>
            </p>
            {isLoading && <LoadingSpinner />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shopItemsData.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col justify-between transition-all duration-300 transform hover:scale-105">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {item.type === 'effect' ? "تأثير يزين اسمك في الواجهة." : "خلفية مميزة لواجهة المستخدم."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-yellow-300 font-bold text-lg">
                      {item.price} نقطة
                    </span>
                    {user.purchasedItems.includes(item.id) ? (
                      <button
                        onClick={() => handleApplyItem(item)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300"
                      >
                        {user.appliedEffect === item.id || user.appliedBackground === item.id ? "تم التطبيق" : "تطبيق"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300"
                      >
                        شراء
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentPage('home')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
        }
        .bg-custom-space {
          background-image: url('https://placehold.co/1920x1080/000000/FFFFFF?text=Space+Background');
        }
        .bg-custom-wood {
          background-image: url('https://placehold.co/1920x1080/4B2C1A/FFFFFF?text=Luxury+Wood');
        }
      `}</style>
      <div className="bg-gray-950 min-h-screen">
        {renderContent()}
        {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}
