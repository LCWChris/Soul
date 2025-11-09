// education/quiz/index.jsx (完整程式碼)

import React, { useEffect, useMemo, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Alert, 
} from "react-native";
// 【修改 1/4：導入 useRouter】
import { useLocalSearchParams, useRouter } from "expo-router"; 

// 【修正點：從 '@/constants/api' 導入配置】
import { API_CONFIG } from '@/constants/api'; 

// 【API 配置】
// 假設 API_CONFIG.BASE_URL = "http://172.20.10.3:3001"
const API_BASE_URL = `${API_CONFIG.BASE_URL}/api/quiz`; 
const DEFAULT_VOLUME = 1; // 預設冊數
const DEFAULT_LESSON = 1; // 預設課數


// =========================================================
// ===== 輔助函式與組件 (位於 QuizScreen 外部) =====
// =========================================================

// 【遊戲化：進度條組件】
function ProgressBar({ current, total }) {
  // ... (程式碼保持不變)
  const progress = Math.min(100, (current / total) * 100);
  return (
    <View style={s.progressBarContainer}>
      <View style={[s.progressBar, { width: `${progress}%` }]} />
    </View>
  );
}

// 【檢查答案的輔助函數】
function checkAnswer(question, userValue) {
    // ... (程式碼保持不變)
    if (!question || !userValue || !question.answer) return false;
    const user = Array.isArray(userValue) ? userValue.slice().sort() : [userValue].slice().sort();
    const correct = Array.isArray(question.answer) ? question.answer.slice().sort() : [question.answer].slice().sort();
    return JSON.stringify(user) === JSON.stringify(correct);
}

// 【簡易評分】
function gradeQuiz(quiz, answers) { 
    // ... (程式碼保持不變)
    let correct = 0; 
    const gradable = quiz.questions.filter((q) => !["video_response", "hotspot"].includes(q.type)); 
    for (const q of gradable) { 
        const user = answers[q.id]; 
        if (!user) continue; 
        if (checkAnswer(q, user)) correct++;
    } 
    const total = gradable.length; 
    const score = total ? Math.round((correct / total) * 100) : 0; 
    return { correct, total, score }; 
} 

// 【新增 2/4：結算畫面組件】
function QuizResults({ results, onRetry, onReturn }) {
    return (
        <View style={s.resultsContainer}>
            <Text style={s.resultsTitle}>測驗完成！</Text>
            
            {/* 顯示分數 */}
            <Text style={s.resultsScore}>{results.score} 分</Text>
            
            {/* 顯示答對題數 */}
            <Text style={s.resultsDetails}>
                (答對 {results.correct} / 總共 {results.total})
            </Text>
            
            {/* 按鈕：重新測驗 */}
            <Pressable 
                style={[s.btn, s.btnPrimary, { width: '80%', marginTop: 20 }]} 
                onPress={onRetry}
            >
                <Text style={[s.btnTextLight, { textAlign: 'center' }]}>重新測驗</Text>
            </Pressable>

            {/* 按鈕：返回 */}
            <Pressable 
                style={[s.btn, { width: '80%', marginTop: 12 }]} 
                onPress={onReturn}
            >
                <Text style={[s.btnTextDark, { textAlign: 'center' }]}>返回</Text>
            </Pressable>
        </View>
    );
}


// =========================================================
// ===== 主要畫面 (QuizScreen) =====
// =========================================================
export default function QuizScreen() {
    // 【修改 3/4：加入 router 和 results 狀態】
    const router = useRouter(); // 用於導航
    const params = useLocalSearchParams();
    
    // 獲取路由參數，若無則使用預設值
    const quizVolume = params.volumeId ? Number(params.volumeId) : DEFAULT_VOLUME;
    const quizLesson = params.lessonId ? Number(params.lessonId) : DEFAULT_LESSON; 
    
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // 核心狀態：用於控制回饋顯示和跳轉
    const [isJumping, setIsJumping] = useState(false); 
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false); 

    // 【新增】用於顯示結算畫面的狀態
    const [results, setResults] = useState(null); 

    // —— 數據獲取 (Fetch API) ——
    useEffect(() => {
        const fetchQuizData = async () => {
            setLoading(true);
            setResults(null); // 【新增】重置結算畫面
            setIndex(0);      // 【新增】重置索引
            setAnswers({});   // 【新增】重置答案
            
            // 構建 API URL: {BASE_URL}/api/quiz/{volume}/{lesson}
            const url = `${API_BASE_URL}/${quizVolume}/${quizLesson}`; 
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                setQuiz(data);
                // (重置狀態已移到 try 之前)
            } catch (error) {
                console.error("Failed to fetch quiz data:", error);
                Alert.alert("載入失敗", `無法從伺服器獲取測驗數據: ${error.message}`);
                setQuiz(null);
            } finally {
                setIsJumping(false); 
                setIsCurrentCorrect(false);
                setLoading(false);
            }
        };
        
        fetchQuizData();
    }, [quizVolume, quizLesson]); 

    const q = useMemo(() => quiz?.questions?.[index], [quiz, index]);

    // —— 核心：作答處理（立即評分並自動跳轉）——
// —— 核心：作答處理（立即評分並自動跳轉）——
    const handleAnswerChange = (qid, val) => {
        if (isJumping) return; 

        setAnswers((prev) => ({ ...prev, [qid]: val }));
        
        const currentQ = quiz?.questions?.find((x) => x.id === qid);
        const correct = checkAnswer(currentQ, val); 
        
        const isMultiSelectFull = 
            currentQ.type === "multi_select" && 
            Array.isArray(val) && 
            val.length === currentQ.answer.length; 
            
        // 單選/是非題或複選題剛好選滿答案數量時，自動跳轉
        const shouldJumpAutomatically = 
            currentQ.type === "single_choice" || 
            currentQ.type === "true_false" ||
            currentQ.type === "image_select" || // 【修正點 A: 新增 image_select 納入自動跳轉】
            isMultiSelectFull; 

        if (shouldJumpAutomatically) {
            setIsCurrentCorrect(correct); 
            setIsJumping(true);           
            
            // 延遲跳轉 (800 毫秒)
            setTimeout(() => {
                // 【修改：檢查是否為最後一題】
                setIndex((i) => {
                    const next = i + 1;
                    const totalQuestions = quiz?.questions?.length ?? 0;
                    
                    if (next < totalQuestions) {
                        // 情況 1：還沒到最後一題，正常跳轉
                        setIsJumping(false); 
                        setIsCurrentCorrect(false);
                        return next;
                    } else {
                        // 情況 2：這就是最後一題，自動交卷！
                        onSubmit(); // <-- 自動觸發提交
                        setIsJumping(false); 
                        return i; // 保持在當前索引 (結算畫面會覆蓋)
                    }
                });
            }, 800); 
        }
    };
    
    // 換題時重設狀態
    useEffect(() => {
        // ... (此函數保持不變)
        setIsJumping(false);
        setIsCurrentCorrect(false);
    }, [index]);

    // 判斷是否已作答 (用於啟用「下一題」按鈕)
    const hasAnswer = useMemo(() => {
        // ... (此函數保持不變)
        if (!q) return false;
        if (isJumping) return true; 

        const currentAnswer = answers[q.id];
        return !!(currentAnswer && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true));
    }, [q, answers, isJumping]);

    // 【手動處理非自動跳轉題型的點擊事件 (排序題/複選題確認)**】
    const handleManualNext = () => {
        // ... (此函數保持不變)
        if (isJumping) return;
        if (!q || !hasAnswer) return;

        const correct = checkAnswer(q, answers[q.id]);
        
        setIsCurrentCorrect(correct);
        setIsJumping(true); 

        setTimeout(() => {
            setIndex((i) => {
                const next = i + 1;
                const totalQuestions = quiz?.questions?.length ?? 0;
                if (next < totalQuestions) {
                    setIsJumping(false); 
                    setIsCurrentCorrect(false);
                    return next;
                } else {
                    setIsJumping(false); 
                    return i;
                }
            });
        }, 800); 
    };

    if (loading) { 
        return ( 
            <View style={s.center}> 
                <ActivityIndicator size="large" color="#1E3A8A" /> 
                <Text style={s.muted}>載入中...</Text> 
            </View> 
        ); 
    } 

    if (!quiz || quiz.questions.length === 0) { 
        return ( 
            <View style={s.center}> 
                <Text style={s.title}>找不到測驗</Text> 
                <Text style={s.muted}>請確認該單元是否有資料 ({quizVolume}冊, {quizLesson}課)</Text> 
            </View> 
        ); 
    } 

    // 【修改 3/4：修改 onSubmit 函數】
    const onSubmit = () => { 
        const { score, correct, total } = gradeQuiz(quiz, answers); 
        // Alert.alert("完成！", `分數：${score} 分（${correct}/${total}）`); // <-- 移除 Alert
        setResults({ score, correct, total }); // <-- 改為設定 results 狀態
    }; 

    // 【修改 3/4：在 return 前加入結算畫面判斷】
    if (results) {
        return (
            <QuizResults 
                results={results}
                onRetry={() => {
                    // 重設狀態以重新開始
                    setResults(null);
                    setIndex(0);
                    setAnswers({});
                    setIsJumping(false);
                    setIsCurrentCorrect(false);
                }}
                onReturn={() => {
                    // 返回上一頁
                    router.back(); 
                }}
            />
        );
    }

    // 判斷是否為需要手動點擊的題型 (排序題或複選題)
    const needsManualNext = (q.type === "order" || q.type === "multi_select");

    // (原有的 return 邏輯保持不變)
    return (
        <View style={s.page}>
            <View style={s.header}>
                <Text style={s.headerTitle}>{quiz.title}</Text>
                <Text style={s.headerSub}>
                    {index + 1} / {quiz.questions.length}
                </Text>
            </View>
            
            <ProgressBar current={index + 1} total={quiz.questions.length} /> 

            <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 24 }}>
                {!!q?.media?.image && (
                    <Image 
                        source={{ uri: q.media.image }} 
                        style={s.media} 
                        resizeMode="contain" 
                    />
                )}
                <Text style={s.prompt}>{q?.prompt}</Text>
                
                {isJumping && (
                    <View style={{ paddingBottom: 10, alignItems: 'center' }}>
                        <Text style={s.feedbackText}>
                            {isCurrentCorrect ? '⭐⭐ 答對了！' : '❌ 答錯了...'}
                        </Text>
                    </View>
                )}

                <QuestionRenderer
                    q={q}
                    value={answers[q?.id]}
                    onChange={(val) => handleAnswerChange(q.id, val)}
                    isJumping={isJumping} 
                />
            </ScrollView>

<View style={s.footer}>
                <Pressable 
                    style={[s.btn, index === 0 && s.btnDisabled]} 
                    onPress={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0 || isJumping} 
                >
                    <Text style={s.btnTextDark}>上一題</Text>
                </Pressable>

                {/* 【修改：頁腳的顯示邏輯】 */}
                {index < quiz.questions.length - 1 ? (
                    // 情況 1：還沒到最後一題
                    needsManualNext ? (
                        // 1a: 手動題型，顯示「下一題」
                        <Pressable
                            style={[s.btn, s.btnPrimary, (!hasAnswer || isJumping) && s.btnDisabled]}
                            onPress={handleManualNext}
                            disabled={!hasAnswer || isJumping}
                        >
                            <Text style={s.btnTextLight}>下一題 </Text>
                        </Pressable>
                    ) : (
                        // 1b: 自動題型，不顯示按鈕
                        <View /> 
                    )
                ) : (
                    // 情況 2：已經是最後一題
                    needsManualNext ? (
                        // 2a: 手動題型 (如排序題)，顯示「交卷」
                        <Pressable 
                            style={[s.btn, s.btnSuccess, (!hasAnswer || isJumping) && s.btnDisabled]} 
                            onPress={onSubmit}
                            disabled={!hasAnswer || isJumping}
                        >
                            <Text style={s.btnTextLight}>交卷</Text>
                        </Pressable>
                    ) : (
                        // 2b: 自動題型 (它會自動提交)，不顯示按鈕
                        <View />
                    )
                )}
            </View>
        </View>
    );
}

// =========================================================
// ===== 題型渲染器 (QuestionRenderer) =====
// =========================================================
function QuestionRenderer({ q, value, onChange, isJumping }) {
    // ... (此組件程式碼保持不變)
    if (!q) return null;

    const isCorrectOption = (optId) => q.answer && q.answer.includes(optId);

    switch (q.type) {
        case "single_choice":
        case "true_false":
        case "multi_select": 
            return (
                <View>
                    {q.options?.map((opt) => {
                        const selected = Array.isArray(value) && value.includes(opt.id);
                        
                        let cardStyle = [s.card];
                        let icon = null;

                        if (isJumping) {
                            const isCorrectAns = isCorrectOption(opt.id);
                            if (selected) {
                                cardStyle.push(isCorrectAns ? s.cardCorrect : s.cardWrong);
                                icon = isCorrectAns ? '✅' : '❌'; 
                            } else if (isCorrectAns) {
                                cardStyle.push(s.cardCorrect);
                                icon = '✅'; 
                            }
                        } else if (selected) {
                            cardStyle.push(s.cardSelected);
                        }
                        
                        const onPressHandler = () => {
                            if (q.type === 'single_choice' || q.type === 'true_false') {
                                onChange([opt.id]); 
                            } else {
                                const newSelection = selected 
                                    ? value.filter(v => v !== opt.id) 
                                    : [...(value || []), opt.id];
                                onChange(newSelection);
                            }
                        };
                        
                        return (
                            <Pressable
                                key={opt.id}
                                style={cardStyle}
                                onPress={onPressHandler} 
                                disabled={isJumping}
                            >
                                <Text style={s.cardText}>{opt.label}</Text>
                                {icon && <Text style={s.feedbackIcon}>{icon}</Text>}
                            </Pressable>
                        );
                    })}
                </View>
            );
        case "image_select":
            return (
                <View style={s.imageSelectContainer}>
                    {q.options?.map((opt) => {
                        const selected = Array.isArray(value) && value.includes(opt.id);
                        let cardStyle = [s.imageOptionCard];
                        let icon = null;

                        if (isJumping) {
                            const isCorrectAns = isCorrectOption(opt.id);
                            if (selected) {
                                cardStyle.push(isCorrectAns ? s.cardCorrect : s.cardWrong);
                                icon = isCorrectAns ? '✅' : '❌'; 
                            } else if (isCorrectAns) {
                                cardStyle.push(s.cardCorrect);
                                icon = '✅'; 
                            }
                        } else if (selected) {
                            cardStyle.push(s.cardSelected);
                        }
                        
                        const onPressHandler = () => {
                            onChange([opt.id]); 
                        };
                        
                        return (
                            <Pressable
                                key={opt.id}
                                style={cardStyle}
                                onPress={onPressHandler} 
                                disabled={isJumping}
                            >
                                {!!opt?.media?.image && (
                                    <Image 
                                        source={{ uri: opt.media.image }} 
                                        style={s.imageOptionImage} 
                                        resizeMode="cover" 
                                    />
                                )}
                                {icon && <Text style={s.feedbackIcon}>{icon}</Text>}
                            </Pressable>
                        );
                    })}
                </View>
            );

        case "order": 
            const list = value?.length ? value : q.items.map((i) => i.id);
            const isOrderCorrect = isJumping && checkAnswer(q, value);
            
            return (
                <View style={[s.orderContainer, isJumping && (isOrderCorrect ? s.cardCorrect : s.cardWrong)]}>
                    {isJumping && <Text style={{ fontSize: 14, fontWeight: 'bold', padding: 8 }}>
                        {isOrderCorrect ? '順序完全正確！✅' : '順序不正確 ❌'}
                    </Text>}
                    {list.map((id, idx) => {
                        const item = q.items.find((i) => i.id === id);
                        return (
                            <View key={id} style={s.orderItem}>
                                <Text style={s.orderIndex}>{idx + 1}.</Text>
                                <Text style={s.orderText}>{item?.label}</Text>
                                <View style={s.orderBtns}>
                                    <Pressable style={[s.orderBtn, isJumping && s.btnDisabled]}
                                        onPress={() => { 
                                            if (idx === 0) return; 
                                            const copy = [...list]; 
                                            [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]]; 
                                            onChange(copy);
                                        }} disabled={idx === 0 || isJumping}>
                                        <Text>▲</Text>
                                    </Pressable>
                                    <Pressable style={[s.orderBtn, isJumping && s.btnDisabled]}
                                        onPress={() => { 
                                            if (idx === list.length - 1) return; 
                                            const copy = [...list]; 
                                            [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]]; 
                                            onChange(copy);
                                        }} disabled={idx === list.length - 1 || isJumping}>
                                        <Text>▼</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>
            );

        default:
            return <Text style={{ color: "red" }}>未知題型：{q.type}</Text>;
    }
}


// =========================================================
// ===== 樣式 (StyleSheet) =====
// =========================================================
const s = StyleSheet.create({
    // ... (所有舊樣式保持不變)
    page: { flex: 1, backgroundColor: "#fff" },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#1E3A8A" },
    headerSub: { marginTop: 4, color: "#6B7280" },
    body: { paddingHorizontal: 20, marginTop: 8 },
    media: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12, resizeMode: "contain" }, 
    prompt: { fontSize: 16, marginBottom: 12, color: "#111827" },
    
    progressBarContainer: {
        height: 6, width: "100%", backgroundColor: "#E5E7EB", marginBottom: 10,
    },
    progressBar: {
        height: "100%", backgroundColor: "#3B82F6", borderRadius: 3,
    },
    feedbackText: {
        fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center',
    },
    feedbackIcon: {
        position: 'absolute', right: 15, fontSize: 20, top: 15, 
    },
    
    card: { 
        padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", marginBottom: 12, 
    },
    cardSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
    cardCorrect: { borderColor: "#10B981", backgroundColor: "#D1FAE5" }, 
    cardWrong: { borderColor: "#EF4444", backgroundColor: "#FEE2E2" },   
    cardText: { fontSize: 16, color: "#111827" },

    orderContainer: {
        borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB",
    },
    orderItem: { 
        flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    },
    orderIndex: {
        fontSize: 16, fontWeight: 'bold', marginRight: 10, color: '#3B82F6',
    },
    orderText: { fontSize: 16, flex: 1 }, 
    orderBtns: { flexDirection: "row" },
    orderBtn: { 
        paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "#F3F4F6", borderRadius: 8, marginLeft: 8,
    }, 

    footer: { 
        flexDirection: "row", justifyContent: "space-between", padding: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#fff", 
    }, 
    btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: "#E5E7EB" }, 
    btnDisabled: { opacity: 0.5 }, 
    btnPrimary: { backgroundColor: "#3B82F6" }, 
    btnSuccess: { backgroundColor: "#10B981" }, 
    btnTextLight: { color: "#fff", fontWeight: "700" }, 
    btnTextDark: { color: "#111827", fontWeight: "700" }, 
    imageSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    imageOptionCard: { 
        width: '48%', 
        aspectRatio: 1, 
        borderRadius: 12, 
        borderWidth: 2, 
        borderColor: "#E5E7EB", 
        backgroundColor: "#fff", 
        marginBottom: 16, 
        overflow: 'hidden', 
    },
    imageOptionImage: {
        width: '100%',
        height: '100%',
    },

    center: { flex: 1, alignItems: "center", justifyContent: "center" }, 
    muted: { color: "#6B7280", marginTop: 6 }, 

    // 【新增 4/4：結算畫面的樣式】
    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    resultsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E3A8A', // 深藍色
        marginBottom: 12,
    },
    resultsScore: {
        fontSize: 64,
        fontWeight: '800',
        color: '#3B82F6', // 主題藍色
        marginBottom: 8,
    },
    resultsDetails: {
        fontSize: 18,
        color: '#6B7280', // 灰色
        marginBottom: 30,
    },
    title: { // (您原本的 !quiz 畫面有用到，但未定義)
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#111827'
    }
});