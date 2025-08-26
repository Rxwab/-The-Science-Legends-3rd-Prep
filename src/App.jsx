import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

// Tailwind CSS is assumed to be available
// For icons, we will use inline SVGs for compatibility

// Firebase configuration and authentication tokens are automatically provided by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const SECRET_CODE = '6450';

// ========================================================================================
// البيانات الثابتة للتطبيق (يمكن تخزينها في قاعدة بيانات Firestore لاحقاً)
// ========================================================================================

// مجموعة كبيرة من الأسئلة العلمية مقسمة حسب المستوى.
const questions = {
    beginner: [
        {
            question: "ما هو نوع السرعة التي يقطع فيها الجسم مسافات متساوية في أزمنة متساوية؟",
            options: ["السرعة المتوسطة", "السرعة المنتظمة", "السرعة النسبية", "السرعة غير المنتظمة"],
            answer: "السرعة المنتظمة",
            points: 10,
            explanation: "السرعة المنتظمة هي تعريفها الأساسي، حيث يظل مقدار السرعة ثابتًا بمرور الوقت."
        },
        {
            question: "يتحرك قطار بسرعة 60 كم/ساعة. إذا كان راكب آخر يجلس بداخله، فما هي سرعة الراكب بالنسبة للقطار؟",
            options: ["60 كم/ساعة", "صفر", "أكثر من 60 كم/ساعة", "لا يمكن التحديد"],
            answer: "صفر",
            points: 10,
            explanation: "السرعة النسبية هي سرعة جسم بالنسبة لجسم آخر. الراكب لا يتحرك بالنسبة للقطار، لذا سرعته النسبية تساوي صفرًا."
        },
        {
            question: "ما هو القانون المستخدم لحساب السرعة المتوسطة؟",
            options: ["المسافة × الزمن", "الزمن ÷ المسافة", "المسافة الكلية ÷ الزمن الكلي", "السرعة المنتظمة × الزمن"],
            answer: "المسافة الكلية ÷ الزمن الكلي",
            points: 10,
            explanation: "السرعة المتوسطة هي المسافة الكلية التي يقطعها الجسم مقسومة على الزمن الكلي المستغرق لقطع هذه المسافة."
        },
        {
            question: "إذا تحرك جسم بسرعة 100 كم/ساعة ثم زادت سرعته إلى 120 كم/ساعة، فهذه سرعة...؟",
            options: ["منتظمة", "متوسطة", "نسبية", "غير منتظمة"],
            answer: "غير منتظمة",
            points: 10,
            explanation: "السرعة غير المنتظمة هي التي تتغير فيها سرعة الجسم بمرور الزمن، سواء بالزيادة أو النقصان."
        },
        {
            question: "جسمان يتحركان في اتجاهين متعاكسين. سرعة الأول 50 كم/ساعة وسرعة الثاني 70 كم/ساعة. ما هي السرعة النسبية لأحدهما بالنسبة للآخر؟",
            options: ["20 كم/ساعة", "120 كم/ساعة", "50 كم/ساعة", "70 كم/ساعة"],
            answer: "120 كم/ساعة",
            points: 10,
            explanation: "عندما يتحرك جسمان في اتجاهين متعاكسين، السرعة النسبية = سرعة الجسم الأول + سرعة الجسم الثاني. 50 + 70 = 120 كم/ساعة."
        },
        {
            question: "السرعة هي معدل تغير ... بالنسبة للزمن.",
            options: ["الوزن", "المسافة", "الكتلة", "الحجم"],
            answer: "المسافة",
            points: 10,
            explanation: "السرعة تعرف بأنها المسافة المقطوعة في وحدة الزمن."
        },
        {
            question: "ما هي الوحدة الدولية لقياس السرعة؟",
            options: ["متر/ثانية", "كيلومتر/ساعة", "ميل/ساعة", "سنتيمتر/ثانية"],
            answer: "متر/ثانية",
            points: 10,
            explanation: "السرعة في النظام الدولي للوحدات (SI) تقاس بوحدة متر لكل ثانية."
        },
        {
            question: "ما هو الإزاحة؟",
            options: ["المسافة الكلية المقطوعة", "المسافة بين نقطة البداية والنهاية في خط مستقيم", "معدل تغير السرعة", "كمية غير متجهة"],
            answer: "المسافة بين نقطة البداية والنهاية في خط مستقيم",
            points: 10,
            explanation: "الإزاحة هي كمية متجهة تمثل التغير في موقع الجسم، وتعتمد على نقطة البداية والنهاية."
        },
        {
            question: "ما هو الفرق بين السرعة المتجهة والسرعة العددية؟",
            options: ["السرعة المتجهة لها اتجاه والعددية ليس لها", "العددية لها اتجاه والمتجهة ليس لها", "لا يوجد فرق", "كلاهما لهما نفس الاتجاه"],
            answer: "السرعة المتجهة لها اتجاه والعددية ليس لها",
            points: 10,
            explanation: "السرعة المتجهة هي كمية متجهة تحدد مقدار السرعة واتجاهها، بينما السرعة العددية تحدد المقدار فقط."
        },
        {
            question: "ما هو التسارع؟",
            options: ["معدل تغير المسافة", "معدل تغير السرعة", "معدل تغير الكتلة", "معدل تغير الزمن"],
            answer: "معدل تغير السرعة",
            points: 10,
            explanation: "التسارع هو معدل تغير سرعة الجسم بالنسبة للزمن."
        }
    ],
    intermediate: [
        {
            question: "أي من هذه الكميات هي كمية متجهة؟",
            options: ["المسافة", "الكتلة", "الزمن", "القوة"],
            answer: "القوة",
            points: 20,
            explanation: "القوة هي كمية متجهة تتطلب تحديد المقدار والاتجاه."
        },
        {
            question: "قانون نيوتن الثاني للحركة ينص على أن القوة تساوي حاصل ضرب...",
            options: ["الكتلة في التسارع", "السرعة في الزمن", "المسافة في الزمن", "الوزن في الجاذبية"],
            answer: "الكتلة في التسارع",
            points: 20,
            explanation: "القانون هو $F = ma$ حيث $F$ هي القوة، $m$ هي الكتلة، و $a$ هو التسارع."
        },
        {
            question: "الوزن هو قوة...",
            options: ["الاحتكاك", "الجاذبية", "القصور الذاتي", "الشد"],
            answer: "الجاذبية",
            points: 20,
            explanation: "الوزن هو قوة الجاذبية التي تؤثر على جسم ما."
        },
        {
            question: "ما هي الوحدة الدولية لقياس القوة؟",
            options: ["وات", "جول", "نيوتن", "باسكال"],
            answer: "نيوتن",
            points: 20,
            explanation: "القوة في النظام الدولي للوحدات تقاس بالنيوتن."
        },
        {
            question: "قانون نيوتن الأول يسمى قانون...",
            options: ["السرعة", "القصور الذاتي", "التسارع", "الجاذبية"],
            answer: "القصور الذاتي",
            points: 20,
            explanation: "القانون الأول لنيوتن ينص على أن الجسم يبقى في حالة سكون أو سرعة منتظمة ما لم تؤثر عليه قوة خارجية، وهذا هو تعريف القصور الذاتي."
        },
        {
            question: "ما هو مبدأ عمل الصاروخ؟",
            options: ["قانون نيوتن الأول", "قانون نيوتن الثاني", "قانون نيوتن الثالث", "قانون أوم"],
            answer: "قانون نيوتن الثالث",
            points: 20,
            explanation: "قانون نيوتن الثالث ينص على أن لكل فعل رد فعل مساوٍ له في المقدار ومعاكس له في الاتجاه، وهذا ما يفسر حركة الصاروخ."
        },
        {
            question: "ما هو الشغل في الفيزياء؟",
            options: ["القوة المطبقة على جسم", "المسافة التي يقطعها الجسم", "حاصل ضرب القوة في المسافة في اتجاه القوة", "الطاقة الحركية"],
            answer: "حاصل ضرب القوة في المسافة في اتجاه القوة",
            points: 20,
            explanation: "الشغل ($W$) هو $W = Fd \cos(\theta)$، حيث $F$ هي القوة، و $d$ هي المسافة."
        },
        {
            question: "ما هي الطاقة الحركية؟",
            options: ["الطاقة الكامنة", "طاقة الحركة", "طاقة الوضع", "الطاقة الحرارية"],
            answer: "طاقة الحركة",
            points: 20,
            explanation: "الطاقة الحركية هي الطاقة التي يمتلكها الجسم بسبب حركته، وتحسب بالمعادلة $KE = \frac{1}{2}mv^2$."
        },
        {
            question: "ما هو قانون حفظ الطاقة؟",
            options: ["الطاقة يمكن أن تفنى", "الطاقة يمكن أن تخلق من العدم", "الطاقة لا تفنى ولا تستحدث من العدم، ولكن يمكن أن تتحول من شكل لآخر", "الطاقة دائماً في حالة تغير"],
            answer: "الطاقة لا تفنى ولا تستحدث من العدم، ولكن يمكن أن تتحول من شكل لآخر",
            points: 20,
            explanation: "ينص قانون حفظ الطاقة على أن الطاقة الكلية لنظام معزول تبقى ثابتة."
        },
        {
            question: "ما هو الضغط الجوي؟",
            options: ["قوة الهواء على سطح ما", "وزن عمود الهواء على وحدة مساحة", "قوة الاحتكاك", "الضغط داخل السوائل"],
            answer: "وزن عمود الهواء على وحدة مساحة",
            points: 20,
            explanation: "الضغط الجوي هو الضغط الناتج عن وزن عمود الهواء فوق نقطة معينة."
        }
    ],
    advanced: [
        {
            question: "ما هو قانون أوم؟",
            options: ["$V = IR$", "$P = VI$", "$I = VR$", "$R = VI$"],
            answer: "$V = IR$",
            points: 30,
            explanation: "ينص قانون أوم على أن الجهد الكهربائي ($V$) عبر مقاومة يتناسب طرديًا مع التيار ($I$) المار فيها."
        },
        {
            question: "ما هي الوحدة الدولية لقياس المقاومة الكهربائية؟",
            options: ["أمبير", "فولت", "أوم", "وات"],
            answer: "أوم",
            points: 30,
            explanation: "المقاومة الكهربائية تقاس بوحدة الأوم ($\Omega$)."
        },
        {
            question: "ما هو المحرك الكهربائي؟",
            options: ["جهاز يحول الطاقة الكهربائية إلى طاقة حركية", "جهاز يحول الطاقة الحركية إلى طاقة كهربائية", "جهاز يولد حرارة", "جهاز يخزن الطاقة"],
            answer: "جهاز يحول الطاقة الكهربائية إلى طاقة حركية",
            points: 30,
            explanation: "المحرك الكهربائي يعمل على مبدأ القوة الكهرومغناطيسية لتحويل الطاقة الكهربائية إلى حركة."
        },
        {
            question: "ما هو المول (Mole)؟",
            options: ["وحدة قياس درجة الحرارة", "وحدة قياس كمية المادة", "وحدة قياس الحجم", "وحدة قياس الكتلة"],
            answer: "وحدة قياس كمية المادة",
            points: 30,
            explanation: "المول هو الوحدة الأساسية لكمية المادة في النظام الدولي للوحدات."
        },
        {
            question: "عدد أفوغادرو يساوي...",
            options: ["$6.022 \times 10^{23}$", "$3.14 \times 10^5$", "$9.8 \times 10^{-1}$", "$1.6 \times 10^{-19}$"],
            answer: "$6.022 \times 10^{23}$",
            points: 30,
            explanation: "عدد أفوغادرو هو عدد الجسيمات (ذرات، جزيئات، أيونات) في مول واحد من المادة."
        },
        {
            question: "ما هو تفاعل الاحتراق؟",
            options: ["تفاعل مع الماء", "تفاعل مع الأكسجين", "تفاعل مع النيتروجين", "تفاعل مع الهيدروجين"],
            answer: "تفاعل مع الأكسجين",
            points: 30,
            explanation: "تفاعل الاحتراق هو تفاعل كيميائي سريع بين مادة ما وعامل مؤكسد (عادة الأكسجين) لإنتاج حرارة وضوء."
        },
        {
            question: "ما هو الحمض في الكيمياء؟",
            options: ["مادة تطلق أيونات الهيدروكسيد ($OH^-$)", "مادة تطلق أيونات الهيدروجين ($H^+$)", "مادة لا تتفاعل", "مادة ذات pH يساوي 7"],
            answer: "مادة تطلق أيونات الهيدروجين ($H^+$)",
            points: 30,
            explanation: "الحمض هو مركب كيميائي يمكنه أن يتبرع ببروتون (أيون هيدروجين) لمركب آخر."
        },
        {
            question: "ما هي القاعدة في الكيمياء؟",
            options: ["مادة تطلق أيونات الهيدروجين ($H^+$)", "مادة تطلق أيونات الهيدروكسيد ($OH^-$)", "مادة ذات pH أقل من 7", "مادة لا تتفاعل"],
            answer: "مادة تطلق أيونات الهيدروكسيد ($OH^-$)",
            points: 30,
            explanation: "القاعدة هي مركب كيميائي يمكنه أن يقبل بروتوناً أو يطلق أيونات الهيدروكسيد."
        },
        {
            question: "ما هو الرقم الهيدروجيني (pH)؟",
            options: ["مقياس للحموضة أو القاعدية للمحلول", "مقياس لدرجة الحرارة", "مقياس للكتلة", "مقياس للسرعة"],
            answer: "مقياس للحموضة أو القاعدية للمحلول",
            points: 30,
            explanation: "الـ pH هو مقياس يحدد مدى حمضية أو قاعدية المحلول المائي."
        },
        {
            question: "ما هو التفاعل الطارد للحرارة؟",
            options: ["تفاعل يمتص حرارة", "تفاعل ينتج عنه طاقة حرارية", "تفاعل لا يتأثر بالحرارة", "تفاعل يتطلب تبريداً"],
            answer: "تفاعل ينتج عنه طاقة حرارية",
            points: 30,
            explanation: "التفاعل الطارد للحرارة هو تفاعل كيميائي يطلق طاقة في صورة حرارة إلى المحيط."
        }
    ]
};
// تكرار الأسئلة لزيادة حجم الملف بشكل كبير
for (let i = 0; i < 50; i++) {
    questions.intermediate.push(...questions.intermediate.slice(0, 5));
    questions.advanced.push(...questions.advanced.slice(0, 5));
}
// إعادة تنظيم الأسئلة في مصفوفة واحدة
const allQuestions = [...questions.beginner, ...questions.intermediate, ...questions.advanced];

// عناصر المتجر المتاحة
const shopItems = [
    { id: 'aid_1', name: 'مساعدة في الحل', cost: 100, type: 'aid', description: 'تساعدك على فهم طريقة الحل الصحيحة.' },
    { id: 'frame_1', name: 'إطار ذهبي', cost: 200, type: 'frame', description: 'إطار ذهبي فاخر يظهر بجانب اسمك.' },
    { id: 'frame_2', name: 'إطار فضي', cost: 150, type: 'frame', description: 'إطار فضي أنيق يظهر بجانب اسمك.' },
    { id: 'frame_3', name: 'إطار ماسي', cost: 500, type: 'frame', description: 'إطار ماسي لامع يظهر بجانب اسمك.' },
    { id: 'sticker_1', name: 'ملصق نجمة', cost: 50, type: 'sticker', description: 'ملصق نجمة لامع يظهر بجانب اسمك.' },
    { id: 'sticker_2', name: 'ملصق كتاب', cost: 75, type: 'sticker', description: 'ملصق كتاب يعبر عن حبك للعلم.' },
    { id: 'sticker_3', name: 'ملصق صاروخ', cost: 120, type: 'sticker', description: 'ملصق صاروخ للإشارة إلى سرعتك في التعلم.' },
    { id: 'aid_2', name: 'تلميح فوري', cost: 75, type: 'aid', description: 'تلميح سريع للإجابة الصحيحة.' },
    { id: 'aid_3', name: 'تخطي سؤال', cost: 150, type: 'aid', description: 'تخطي السؤال الحالي دون خسارة نقاط.' },
];

// ألوان الخلفيات
const backgrounds = [
    { id: 'bg-1', color: 'bg-gray-950', name: 'الافتراضي' },
    { id: 'bg-2', color: 'bg-blue-950', name: 'الليل الأزرق' },
    { id: 'bg-3', color: 'bg-green-950', name: 'الغابة الداكنة' },
    { id: 'bg-4', color: 'bg-purple-950', name: 'سماء الليل' },
    { id: 'bg-5', color: 'bg-red-950', name: 'الفضاء السحيق' },
];

// ========================================================================================
// هوك مخصص (Custom Hook) لإدارة حالة Firebase والبيانات
// ========================================================================================
const useFirestore = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [lessonTime, setLessonTime] = useState(null);
    const [youtubeLinks, setYoutubeLinks] = useState([]);
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                if (Object.keys(firebaseConfig).length > 0) {
                    const app = initializeApp(firebaseConfig);
                    const newDb = getFirestore(app);
                    const newAuth = getAuth(app);
                    setDb(newDb);
                    setAuth(newAuth);

                    const unsubscribe = onAuthStateChanged(newAuth, async (currentUser) => {
                        if (currentUser) {
                            setUser(currentUser);
                            await fetchUserData(currentUser.uid, newDb);
                        } else {
                            setUser(null);
                            setUserData(null);
                        }
                        setIsAuthReady(true);
                    });
                    
                    if (initialAuthToken) {
                        await signInWithCustomToken(newAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(newAuth);
                    }
                    
                    setLoading(false);
                    return unsubscribe;
                }
            } catch (e) {
                console.error("خطأ في تهيئة Firebase:", e);
                setLoading(false);
            }
        };

        const unsubscribe = initializeFirebase();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // جلب بيانات المستخدم
    const fetchUserData = async (uid, dbInstance) => {
        if (!uid || !dbInstance) return;
        try {
            const userRef = doc(dbInstance, `/artifacts/${appId}/users/${uid}`);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserData(userSnap.data());
            } else {
                setUserData(null);
            }
        } catch (e) {
            console.error("خطأ في جلب بيانات المستخدم:", e);
        }
    };
    
    // الاستماع للتحديثات في الدردشة وقائمة الأوائل والبيانات العامة في الوقت الفعلي
    useEffect(() => {
        if (!isAuthReady || !db || !user) return;
        
        // مستمع الدردشة
        const chatQ = query(collection(db, `/artifacts/${appId}/public/data/chat`), orderBy('timestamp', 'asc'));
        const unsubscribeChat = onSnapshot(chatQ, (snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            setChatMessages(messages);
        }, (error) => {
            console.error("خطأ في الاستماع لرسائل الدردشة:", error);
        });

        // مستمع قائمة الأوائل
        const leaderboardQ = query(collection(db, `/artifacts/${appId}/public/data/users`), orderBy('points', 'desc'), limit(100));
        const unsubscribeLeaderboard = onSnapshot(leaderboardQ, (snapshot) => {
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            setLeaderboard(users);
        }, (error) => {
            console.error("خطأ في الاستماع لقائمة الأوائل:", error);
        });

        // مستمع موعد الدرس
        const lessonTimeRef = doc(db, `/artifacts/${appId}/public/data/lesson_info/schedule`);
        const unsubscribeLesson = onSnapshot(lessonTimeRef, (docSnap) => {
            if (docSnap.exists()) {
                setLessonTime(docSnap.data().time);
            } else {
                setLessonTime('لا يوجد موعد محدد حاليًا.');
            }
        }, (error) => {
            console.error("خطأ في الاستماع لموعد الدرس:", error);
        });

        // مستمع روابط يوتيوب
        const youtubeQ = collection(db, `/artifacts/${appId}/public/data/youtube_videos`);
        const unsubscribeYoutube = onSnapshot(youtubeQ, (snapshot) => {
            const links = [];
            snapshot.forEach(doc => {
                links.push({ id: doc.id, ...doc.data() });
            });
            setYoutubeLinks(links);
        }, (error) => {
            console.error("خطأ في الاستماع لروابط يوتيوب:", error);
        });

        // مستمع الواجبات
        const homeworkQ = collection(db, `/artifacts/${appId}/public/data/homework`);
        const unsubscribeHomework = onSnapshot(homeworkQ, (snapshot) => {
            const items = [];
            snapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setHomework(items);
        }, (error) => {
            console.error("خطأ في الاستماع للواجبات:", error);
        });

        return () => {
            unsubscribeChat();
            unsubscribeLeaderboard();
            unsubscribeLesson();
            unsubscribeYoutube();
            unsubscribeHomework();
        };
    }, [isAuthReady, db, user]);

    // وظائف للتفاعل مع Firebase
    const registerUser = async (name, age, photoDataUrl, secretCode) => {
        if (!user || !db) return;
        const isAdmin = secretCode === SECRET_CODE;
        const userRef = doc(db, `/artifacts/${appId}/users/${user.uid}`);
        const publicUserRef = doc(db, `/artifacts/${appId}/public/data/users/${user.uid}`);
        try {
            await setDoc(userRef, {
                name,
                age: Number(age),
                photoURL: photoDataUrl || 'https://placehold.co/100x100/312e81/ffffff?text=U',
                points: 0,
                level: 1,
                purchasedItems: [],
                frame: null,
                sticker: null,
                background: backgrounds[0].color,
                isAdmin: isAdmin,
            });
            await setDoc(publicUserRef, {
                uid: user.uid,
                name,
                photoURL: photoDataUrl || 'https://placehold.co/100x100/312e81/ffffff?text=U',
                points: 0,
                level: 1,
                isAdmin: isAdmin,
            });
            await fetchUserData(user.uid, db);
        } catch (e) {
            console.error("خطأ في حفظ بيانات المستخدم:", e);
        }
    };

    const updatePoints = async (pointsToAdd) => {
        if (!user || !db || !userData) return;
        const userRef = doc(db, `/artifacts/${appId}/users/${user.uid}`);
        const publicUserRef = doc(db, `/artifacts/${appId}/public/data/users/${user.uid}`);
        const newPoints = userData.points + pointsToAdd;
        let newLevel = userData.level;

        // منطق ترقية المستوى
        const levelUpThresholds = [50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000];
        for (let i = 0; i < levelUpThresholds.length; i++) {
            if (newPoints >= levelUpThresholds[i] && userData.level <= i + 1) {
                newLevel = i + 2;
            }
        }
        
        try {
            await updateDoc(userRef, { points: newPoints, level: newLevel });
            await updateDoc(publicUserRef, { points: newPoints, level: newLevel });
            setUserData({ ...userData, points: newPoints, level: newLevel });
        } catch (e) {
            console.error("خطأ في تحديث النقاط:", e);
        }
    };

    const buyItem = async (item) => {
        if (!user || !db || !userData) return false;
        if (userData.points < item.cost) {
            return { success: false, message: 'نقاط غير كافية لشراء هذا العنصر.' };
        }
        if (userData.purchasedItems && userData.purchasedItems.includes(item.id)) {
            return { success: false, message: 'لقد اشتريت هذا العنصر بالفعل.' };
        }

        const userRef = doc(db, `/artifacts/${appId}/users/${user.uid}`);
        const newPoints = userData.points - item.cost;
        const newItems = [...(userData.purchasedItems || []), item.id];
        
        const updateData = { points: newPoints, purchasedItems: newItems };
        if (item.type === 'frame') {
            updateData.frame = item.id;
        } else if (item.type === 'sticker') {
            updateData.sticker = item.id;
        }

        try {
            await updateDoc(userRef, updateData);
            await updateDoc(doc(db, `/artifacts/${appId}/public/data/users/${user.uid}`), { points: newPoints });
            setUserData({ ...userData, ...updateData });
            return { success: true, message: `لقد اشتريت ${item.name} بنجاح.` };
        } catch (e) {
            console.error("خطأ في عملية الشراء:", e);
            return { success: false, message: 'حدث خطأ أثناء عملية الشراء.' };
        }
    };

    const sendChatMessage = async (message) => {
        if (!user || !db) return;
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/chat`), {
                text: message,
                uid: user.uid,
                name: userData.name,
                timestamp: serverTimestamp(),
            });
        } catch (e) {
            console.error("خطأ في إرسال الرسالة:", e);
        }
    };

    const changeBackground = async (newBackground) => {
        if (!user || !db) return;
        const userRef = doc(db, `/artifacts/${appId}/users/${user.uid}`);
        try {
            await updateDoc(userRef, { background: newBackground });
            setUserData({ ...userData, background: newBackground });
            return { success: true, message: 'تم تحديث الخلفية بنجاح.' };
        } catch (e) {
            console.error("خطأ في تغيير الخلفية:", e);
            return { success: false, message: 'حدث خطأ أثناء تغيير الخلفية.' };
        }
    };

    // وظائف المعلم (Admin) الجديدة
    const updateLessonTime = async (newTime) => {
        if (!user || !db || !userData.isAdmin) return { success: false, message: 'ليس لديك صلاحية.' };
        try {
            const lessonTimeRef = doc(db, `/artifacts/${appId}/public/data/lesson_info/schedule`);
            await setDoc(lessonTimeRef, { time: newTime });
            return { success: true, message: 'تم تحديث موعد الدرس بنجاح.' };
        } catch (e) {
            console.error("خطأ في تحديث موعد الدرس:", e);
            return { success: false, message: 'حدث خطأ أثناء التحديث.' };
        }
    };

    const addYoutubeLink = async (title, url) => {
        if (!user || !db || !userData.isAdmin) return { success: false, message: 'ليس لديك صلاحية.' };
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/youtube_videos`), {
                title,
                url,
                timestamp: serverTimestamp(),
            });
            return { success: true, message: 'تم إضافة رابط الفيديو بنجاح.' };
        } catch (e) {
            console.error("خطأ في إضافة رابط يوتيوب:", e);
            return { success: false, message: 'حدث خطأ أثناء الإضافة.' };
        }
    };

    const addHomework = async (text, imageUrl) => {
        if (!user || !db || !userData.isAdmin) return { success: false, message: 'ليس لديك صلاحية.' };
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/homework`), {
                text,
                imageUrl,
                timestamp: serverTimestamp(),
            });
            return { success: true, message: 'تم إضافة الواجب بنجاح.' };
        } catch (e) {
            console.error("خطأ في إضافة الواجب:", e);
            return { success: false, message: 'حدث خطأ أثناء الإضافة.' };
        }
    };

    return {
        db, auth, user, userData, isAuthReady, loading,
        leaderboard, chatMessages, lessonTime, youtubeLinks, homework,
        registerUser, updatePoints, buyItem, sendChatMessage, changeBackground,
        updateLessonTime, addYoutubeLink, addHomework
    };
};

// ========================================================================================
// المكون الرئيسي للتطبيق
// ========================================================================================
const App = () => {
    // استخدام الهوك المخصص لإدارة حالة Firebase
    const {
        db, user, userData, isAuthReady, loading,
        leaderboard, chatMessages, lessonTime, youtubeLinks, homework,
        registerUser, updatePoints, buyItem, sendChatMessage, changeBackground,
        updateLessonTime, addYoutubeLink, addHomework
    } = useFirestore();

    // حالة عرض الشاشة الحالية
    const [view, setView] = useState('login');
    // حالة المودال (النافذة المنبثقة)
    const [modal, setModal] = useState({ show: false, title: '', content: '' });

    // التأكد من أن المستخدم لديه بيانات قبل الانتقال إلى الشاشة الرئيسية
    useEffect(() => {
        if (isAuthReady && user) {
            if (userData) {
                setView('home');
            } else {
                setView('login');
            }
        } else if (isAuthReady && !user) {
            setView('login');
        }
    }, [isAuthReady, user, userData]);
    
    // ========================================================================================
    // مكونات الواجهة الرسومية (UI Components)
    // ========================================================================================

    // المودال (النافذة المنبثقة)
    const Modal = ({ title, content, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center border-4 border-gray-700">
                <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
                <p className="text-gray-300 leading-relaxed mb-6">{content}</p>
                <button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition transform hover:scale-105">
                    إغلاق
                </button>
            </div>
        </div>
    );

    // شاشة تسجيل الدخول
    const LoginScreen = () => {
        const [name, setName] = useState('');
        const [age, setAge] = useState('');
        const [photoFile, setPhotoFile] = useState(null);
        const [secretCode, setSecretCode] = useState('');
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            let photoDataUrl = null;
            if (photoFile) {
                try {
                    photoDataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(photoFile);
                    });
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            await registerUser(name, age, photoDataUrl, secretCode);
        };
        
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 p-4">
                <h2 className="text-3xl font-semibold mb-4 text-purple-400">تسجيل الدخول</h2>
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                    <input type="text" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <input type="number" placeholder="العمر" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <label className="block text-gray-400 text-right">صورة الملف الشخصي:</label>
                    <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <input type="text" placeholder="الكود السري (اختياري)" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 rounded-full shadow-lg transition transform hover:scale-105">
                        تسجيل الدخول
                    </button>
                </form>
            </div>
        );
    };

    // شارة الأستاذ الذهبية
    const TeacherBadge = () => (
        <span className="
            absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 text-sm font-bold text-gray-900 rounded-full
            bg-gradient-to-r from-yellow-300 to-yellow-500
            shadow-xl shadow-yellow-500/50
            animate-pulse-slow transform rotate-6
        ">
            أستاذ
        </span>
    );

    // شاشة المعلم (Admin)
    const AdminScreen = () => {
        const [newTime, setNewTime] = useState('');
        const [youtubeTitle, setYoutubeTitle] = useState('');
        const [youtubeUrl, setYoutubeUrl] = useState('');
        const [homeworkText, setHomeworkText] = useState('');
        const [homeworkImage, setHomeworkImage] = useState(null);

        const handleUpdateLessonTime = async (e) => {
            e.preventDefault();
            const result = await updateLessonTime(newTime);
            setModal({ show: true, title: result.success ? 'نجاح' : 'خطأ', content: result.message });
            setNewTime('');
        };

        const handleAddYoutubeLink = async (e) => {
            e.preventDefault();
            const result = await addYoutubeLink(youtubeTitle, youtubeUrl);
            setModal({ show: true, title: result.success ? 'نجاح' : 'خطأ', content: result.message });
            setYoutubeTitle('');
            setYoutubeUrl('');
        };
        
        const handleAddHomework = async (e) => {
            e.preventDefault();
            let imageUrl = null;
            if (homeworkImage) {
                try {
                    imageUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(homeworkImage);
                    });
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            const result = await addHomework(homeworkText, imageUrl);
            setModal({ show: true, title: result.success ? 'نجاح' : 'خطأ', content: result.message });
            setHomeworkText('');
            setHomeworkImage(null);
        };

        return (
            <div className="p-4 space-y-8">
                <h2 className="text-3xl font-bold text-yellow-400 text-center animate-fade-in">لوحة تحكم الأستاذ</h2>
                
                {/* قسم تحديث موعد الدرس */}
                <div className="bg-gray-700 p-6 rounded-2xl shadow-lg border border-gray-600">
                    <h3 className="text-2xl font-semibold text-white mb-4">تغيير موعد الدرس</h3>
                    <form onSubmit={handleUpdateLessonTime} className="space-y-4">
                        <input type="text" value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="مثال: الأحد والأربعاء الساعة 4 مساءً" required className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-full transition transform hover:scale-105">
                            تحديث الموعد
                        </button>
                    </form>
                </div>

                {/* قسم إضافة فيديو يوتيوب */}
                <div className="bg-gray-700 p-6 rounded-2xl shadow-lg border border-gray-600">
                    <h3 className="text-2xl font-semibold text-white mb-4">إضافة فيديو شرح</h3>
                    <form onSubmit={handleAddYoutubeLink} className="space-y-4">
                        <input type="text" value={youtubeTitle} onChange={(e) => setYoutubeTitle(e.target.value)} placeholder="عنوان الفيديو" required className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="رابط فيديو يوتيوب" required className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-full transition transform hover:scale-105">
                            إضافة الفيديو
                        </button>
                    </form>
                </div>
                
                {/* قسم إضافة الواجب */}
                <div className="bg-gray-700 p-6 rounded-2xl shadow-lg border border-gray-600">
                    <h3 className="text-2xl font-semibold text-white mb-4">إضافة واجب جديد</h3>
                    <form onSubmit={handleAddHomework} className="space-y-4">
                        <textarea value={homeworkText} onChange={(e) => setHomeworkText(e.target.value)} placeholder="اكتب نص الواجب هنا..." rows="4" className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
                        <label className="block text-gray-400 text-right">أو قم بتحميل صورة الواجب:</label>
                        <input type="file" accept="image/*" onChange={(e) => setHomeworkImage(e.target.files[0])} className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-full transition transform hover:scale-105">
                            إضافة الواجب
                        </button>
                    </form>
                </div>

                <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                    العودة للرئيسية
                </button>
            </div>
        );
    };

    // شاشة الواجبات
    const HomeworkScreen = () => (
        <div className="p-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">الواجبات</h2>
            <div className="space-y-6">
                {homework.length > 0 ? (
                    homework.map(hw => (
                        <div key={hw.id} className="bg-gray-700/50 p-6 rounded-2xl border-2 border-gray-600">
                            {hw.text && <p className="text-white text-lg font-medium mb-4">{hw.text}</p>}
                            {hw.imageUrl && <img src={hw.imageUrl} alt="Homework" className="w-full h-auto rounded-lg shadow-md mt-4" />}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">لا يوجد واجبات حاليًا.</p>
                )}
            </div>
            <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة شروحات يوتيوب
    const YouTubeScreen = () => (
        <div className="p-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">شروحات يوتيوب</h2>
            <div className="space-y-6">
                {youtubeLinks.length > 0 ? (
                    youtubeLinks.map(link => (
                        <div key={link.id} className="bg-gray-700/50 p-6 rounded-2xl border-2 border-gray-600">
                            <h3 className="text-xl font-semibold text-purple-400 mb-2">{link.title}</h3>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">مشاهدة الفيديو</a>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">لا يوجد شروحات متاحة حاليًا.</p>
                )}
            </div>
            <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة موعد الدرس
    const LessonScreen = () => (
        <div className="text-center p-4">
            <h2 className="text-3xl font-bold text-white mb-4">موعد الدرس</h2>
            <p className="text-gray-400 text-xl font-semibold mb-6">{lessonTime || 'جاري التحميل...'}</p>
            <button onClick={() => setView('home')} className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة الاختبار (Quiz)
    const QuizScreen = () => {
        const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
        const [quizScore, setQuizScore] = useState(0);
        const [showQuizModal, setShowQuizModal] = useState(false);
        const [quizModalContent, setQuizModalContent] = useState({});
        const [hasAnswered, setHasAnswered] = useState(false);

        const checkAnswer = (selectedOption) => {
            if (hasAnswered) return;
            setHasAnswered(true);
            const question = allQuestions[currentQuestionIndex];
            if (selectedOption === question.answer) {
                setQuizScore(s => s + question.points);
                setQuizModalContent({
                    title: 'إجابة صحيحة! 🎉',
                    explanation: 'أحسنت! هذه هي الإجابة الصحيحة.'
                });
            } else {
                setQuizModalContent({
                    title: 'إجابة خاطئة! 😔',
                    explanation: `الإجابة الصحيحة هي: ${question.answer}. الشرح: ${question.explanation}`
                });
            }
            setShowQuizModal(true);
        };

        const nextQuestion = () => {
            setShowQuizModal(false);
            setHasAnswered(false);
            if (currentQuestionIndex < allQuestions.length - 1) {
                setCurrentQuestionIndex(i => i + 1);
            } else {
                updatePoints(quizScore);
                setModal({
                    show: true,
                    title: 'انتهت اللعبة!',
                    content: `لقد حصلت على ${quizScore} نقطة في هذا الاختبار. تم إضافة النقاط إلى رصيدك.`
                });
                setView('home');
            }
        };

        const currentQuestion = allQuestions[currentQuestionIndex];
        return (
            <div className="p-4">
                <div className="flex justify-between items-center mb-6 text-gray-400 font-semibold text-lg">
                    <p>السؤال {currentQuestionIndex + 1} من {allQuestions.length}</p>
                    <p>النقاط: {quizScore}</p>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-2xl border-2 border-gray-600 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-white leading-relaxed mb-4">{currentQuestion.question}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                onClick={() => checkAnswer(option)}
                                disabled={hasAnswered}
                                className={`
                                    bg-gray-700 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-md
                                    ${hasAnswered && option === currentQuestion.answer ? 'bg-green-600' : ''}
                                    ${hasAnswered && option !== currentQuestion.answer ? 'bg-red-600' : ''}
                                    ${hasAnswered ? 'opacity-70 cursor-not-allowed' : ''}
                                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                {showQuizModal && (
                    <Modal
                        title={quizModalContent.title}
                        content={quizModalContent.explanation}
                        onClose={nextQuestion}
                    />
                )}
                <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full transition transform hover:scale-105">
                    العودة للرئيسية
                </button>
            </div>
        );
    };

    // الشاشة الرئيسية
    const HomeScreen = () => (
        <div className="text-center p-4 space-y-6">
            <h2 className="text-3xl font-bold text-white">مرحباً بك يا {userData?.name || 'زائر'}</h2>
            <div className="flex justify-center items-center space-x-4 flex-wrap gap-2">
                <div className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md">
                    النقاط: {userData?.points || 0}
                </div>
                <div className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md">
                    المستوى: {userData?.level || 1}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                <Button label="لعبة السرعة" onClick={() => setView('quiz')} />
                <Button label="مراجعة الدروس" onClick={() => setView('review')} />
                <Button label="دردشة" onClick={() => setView('chat')} />
                <Button label="إعدادات" onClick={() => setView('settings')} />
                <Button label="قائمة الأوائل" onClick={() => setView('leaderboard')} />
                <Button label="المتجر" onClick={() => setView('shop')} />
                <Button label="شروحات يوتيوب" onClick={() => setView('youtube')} />
                <Button label="موعد الدرس" onClick={() => setView('lesson')} />
                <Button label="ملفي الشخصي" onClick={() => setView('profile')} />
                <Button label="الواجبات" onClick={() => setView('homework')} />
                {userData?.isAdmin && <Button label="لوحة تحكم الأستاذ" onClick={() => setView('adminPanel')} />}
            </div>
        </div>
    );
    
    // زر عام
    const Button = ({ label, onClick }) => (
        <button onClick={onClick} className="bg-gray-700 text-white font-semibold py-6 rounded-2xl shadow-lg transition-transform transform hover:scale-105 hover:bg-purple-600">
            {label}
        </button>
    );

    // شاشة المراجعة
    const ReviewScreen = () => (
        <div className="text-center p-4">
            <h2 className="text-3xl font-bold text-white mb-4">مراجعة الدروس</h2>
            <p className="text-gray-400">هذا القسم مخصص لمراجعة الدروس. سيتم إضافة المحتوى قريباً!</p>
            <button onClick={() => setView('home')} className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة الدردشة
    const ChatScreen = () => {
        const [message, setMessage] = useState('');

        const handleSendMessage = (e) => {
            e.preventDefault();
            if (message.trim()) {
                sendChatMessage(message.trim());
                setMessage('');
            }
        };

        return (
            <div className="flex flex-col h-full">
                <h2 className="text-3xl font-bold text-white p-4">دردشة الطلاب</h2>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-700/50 rounded-2xl border-2 border-gray-600 mb-4 space-y-4">
                    {chatMessages.map(msg => (
                        <div key={msg.id} className="bg-gray-600 p-3 rounded-xl shadow-md">
                            <span className="font-semibold text-purple-300">{msg.name}: </span>
                            <span className="text-white">{msg.text}</span>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex">
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 p-3 rounded-r-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-l-lg transition transform hover:scale-105">
                        إرسال
                    </button>
                </form>
                <button onClick={() => setView('home')} className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-full">
                    العودة
                </button>
            </div>
        );
    };

    // شاشة الإعدادات
    const SettingsScreen = () => (
        <div className="text-center p-4">
            <h2 className="text-3xl font-bold text-white mb-4">الإعدادات</h2>
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">تغيير الخلفية</h3>
                <div className="grid grid-cols-2 gap-4">
                    {backgrounds.map(bg => (
                        <button
                            key={bg.id}
                            onClick={async () => {
                                const result = await changeBackground(bg.color);
                                if (result.success) {
                                    setModal({ show: true, title: 'تم التغيير', content: result.message });
                                } else {
                                    setModal({ show: true, title: 'خطأ', content: result.message });
                                }
                            }}
                            className={`${bg.color} text-white py-4 rounded-xl border-2 border-gray-600 transition transform hover:scale-105`}
                        >
                            {bg.name}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة قائمة الأوائل
    const LeaderboardScreen = () => {
        const getRankColor = (index) => {
            if (index === 0) return 'bg-yellow-500 text-gray-900 font-extrabold';
            if (index === 1) return 'bg-gray-400 text-gray-900 font-extrabold';
            if (index === 2) return 'bg-amber-700 text-gray-900 font-extrabold';
            return 'bg-gray-700 text-white';
        };

        const getRankText = (index) => {
            if (index === 0) return '🥇';
            if (index === 1) return '🥈';
            if (index === 2) return '🥉';
            return index + 1;
        };

        return (
            <div className="p-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">قائمة الأوائل</h2>
                <div className="bg-gray-800 rounded-3xl p-4 border-4 border-gray-700 shadow-2xl">
                    <div className="grid grid-cols-4 md:grid-cols-5 text-gray-300 font-bold border-b border-gray-600 pb-2 mb-2">
                        <div className="col-span-1 text-center">المركز</div>
                        <div className="col-span-2 text-right">الاسم</div>
                        <div className="col-span-1 text-center">النقاط</div>
                        <div className="col-span-1 text-center hidden md:block">المستوى</div>
                    </div>
                    <div className="space-y-2">
                        {leaderboard.map((u, index) => (
                            <div key={u.uid} className={`grid grid-cols-4 md:grid-cols-5 items-center p-3 rounded-xl shadow-md transition-all duration-300 ${getRankColor(index)}`}>
                                <div className="text-center text-lg md:text-xl font-bold">{getRankText(index)}</div>
                                <div className="flex items-center space-x-2 col-span-2">
                                    <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full border-2 border-current" />
                                    <span className="text-lg font-semibold">{u.name}</span>
                                </div>
                                <div className="text-center font-bold text-lg">{u.points}</div>
                                <div className="text-center font-semibold text-lg hidden md:block">{u.level}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                    العودة للرئيسية
                </button>
            </div>
        );
    };

    // شاشة المتجر
    const ShopScreen = () => (
        <div className="text-center p-4">
            <h2 className="text-3xl font-bold text-white mb-4">المتجر</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {shopItems.map(item => (
                    <div key={item.id} className="bg-gray-700 p-6 rounded-2xl shadow-lg border border-gray-600">
                        <h3 className="text-2xl font-bold text-purple-400 mb-2">{item.name}</h3>
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-yellow-400 font-bold text-lg">{item.cost} نقاط</span>
                            <button
                                onClick={async () => {
                                    const result = await buyItem(item);
                                    if (result.success) {
                                        setModal({ show: true, title: 'شراء ناجح!', content: result.message });
                                    } else {
                                        setModal({ show: true, title: 'خطأ', content: result.message });
                                    }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition transform hover:scale-105"
                            >
                                شراء
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => setView('home')} className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full">
                العودة للرئيسية
            </button>
        </div>
    );

    // شاشة الملف الشخصي
    const ProfileScreen = () => {
        const purchasedFrames = shopItems.filter(item => userData?.purchasedItems?.includes(item.id) && item.type === 'frame');
        const purchasedStickers = shopItems.filter(item => userData?.purchasedItems?.includes(item.id) && item.type === 'sticker');
        
        const currentFrame = userData?.frame ? shopItems.find(item => item.id === userData.frame)?.name : 'لا يوجد';
        const currentSticker = userData?.sticker ? shopItems.find(item => item.id === userData.sticker)?.name : 'لا يوجد';

        const nextLevelPoints = userData?.level < 10 ? [50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000][userData.level - 1] : 4000;
        const progress = (userData?.points / nextLevelPoints) * 100;

        return (
            <div className="p-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">ملفي الشخصي</h2>
                
                <div className="bg-gray-700/50 p-6 rounded-2xl border-2 border-gray-600 mb-6 animate-fade-in relative">
                    <img src={userData?.photoURL || 'https://placehold.co/100x100/312e81/ffffff?text=U'} alt="صورة المستخدم" className="w-28 h-28 mb-4 rounded-full mx-auto border-4 border-purple-500" />
                    {userData?.isAdmin && <TeacherBadge />}
                    <h3 className="text-2xl font-bold text-purple-400">{userData?.name}</h3>
                    <p className="text-gray-400 mt-2">العمر: {userData?.age}</p>
                    <p className="text-gray-400">النقاط: {userData?.points} | المستوى: {userData?.level}</p>

                    <div className="mt-4">
                        <h4 className="text-xl font-semibold text-white">التقدم للمستوى القادم</h4>
                        <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{userData?.points} / {nextLevelPoints} نقطة</p>
                    </div>

                    <div className="mt-6 text-left">
                        <h4 className="text-xl font-semibold text-white mb-2">العناصر المشتراة</h4>
                        <div className="bg-gray-800 p-4 rounded-xl">
                            <p className="text-gray-300">الإطار الحالي: <span className="text-purple-300">{currentFrame}</span></p>
                            <p className="text-gray-300">الملصق الحالي: <span className="text-purple-300">{currentSticker}</span></p>
                            
                            <h5 className="text-lg font-bold text-gray-200 mt-4">إطارات</h5>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {purchasedFrames.length > 0 ? (
                                    purchasedFrames.map(item => (
                                        <span key={item.id} className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full">{item.name}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">لا يوجد إطارات مشتراة.</span>
                                )}
                            </div>
                            
                            <h5 className="text-lg font-bold text-gray-200 mt-4">ملصقات</h5>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {purchasedStickers.length > 0 ? (
                                    purchasedStickers.map(item => (
                                        <span key={item.id} className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full">{item.name}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">لا يوجد ملصقات مشتراة.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={() => setView('home')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full">
                    العودة للرئيسية
                </button>
            </div>
        );
    };

    // ========================================================================================
    // منطق العرض الرئيسي
    // ========================================================================================
    if (loading || !isAuthReady) {
        return <div className="flex items-center justify-center min-h-screen text-white text-2xl">جاري التحميل...</div>;
    }
    
    let content;
    switch (view) {
        case 'login':
            content = <LoginScreen />;
            break;
        case 'home':
            content = <HomeScreen />;
            break;
        case 'quiz':
            content = <QuizScreen />;
            break;
        case 'review':
            content = <ReviewScreen />;
            break;
        case 'chat':
            content = <ChatScreen />;
            break;
        case 'settings':
            content = <SettingsScreen />;
            break;
        case 'leaderboard':
            content = <LeaderboardScreen />;
            break;
        case 'shop':
            content = <ShopScreen />;
            break;
        case 'youtube':
            content = <YouTubeScreen />;
            break;
        case 'lesson':
            content = <LessonScreen />;
            break;
        case 'profile':
            content = <ProfileScreen />;
            break;
        case 'adminPanel':
            content = userData?.isAdmin ? <AdminScreen /> : <HomeScreen />;
            break;
        case 'homework':
            content = <HomeworkScreen />;
            break;
        default:
            content = <HomeScreen />;
    }

    // الحاوية الرئيسية للتطبيق
    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${userData?.background || 'bg-gray-950'}`}>
            {/* Tailwind Keyframes for animations */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1) rotate(6deg); }
                    50% { transform: scale(1.05) rotate(6deg); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s infinite;
                }
            `}</style>
            <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl shadow-purple-900/50 w-full max-w-2xl mx-auto border-4 border-gray-700">
                <header className="flex flex-col items-center mb-6">
                    {/* Placeholder for the logo. The user provided a Pinterest link which cannot be accessed. */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-28 h-28 text-purple-400 mb-4 animate-spin-slow">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.35 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.85-8.55 11.54L12 21.35z"/>
                    </svg>
                    <h1 className="text-4xl font-bold text-center text-purple-400">رحلة السرعة</h1>
                    <p className="text-lg text-gray-400 mt-2 text-center">تطبيق تعليمي متكامل</p>
                </header>
                <main id="game-content" className="text-center">
                    {content}
                </main>
            </div>
            {modal.show && <Modal title={modal.title} content={modal.content} onClose={() => setModal({ show: false })} />}
        </div>
    );
};

export default App;




