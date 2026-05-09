/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronLeft, 
  Trophy, 
  Lightbulb, 
  RotateCcw, 
  BrainCircuit,
  Leaf,
  Container,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  UserPlus,
  Trash2,
  Play,
  Timer,
  User,
  RefreshCw,
  Palette
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Unit = 'nutrition' | 'digestion' | 'transport' | 'control';
type Step = 'participants' | 'unitSelection' | 'playerPicker' | 'quiz' | 'result';
type ThemeColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'zinc';

const THEME_MAP: Record<ThemeColor, { 
  primary: string, 
  hover: string, 
  text: string, 
  bg: string, 
  border: string, 
  light: string,
  accent: string 
}> = {
  emerald: { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', light: 'bg-emerald-100', accent: 'text-emerald-700' },
  blue: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500', light: 'bg-blue-100', accent: 'text-blue-700' },
  purple: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500', light: 'bg-purple-100', accent: 'text-purple-700' },
  amber: { primary: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500', light: 'bg-amber-100', accent: 'text-amber-700' },
  rose: { primary: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-500', light: 'bg-rose-100', accent: 'text-rose-700' },
  zinc: { primary: 'bg-zinc-800', hover: 'hover:bg-zinc-900', text: 'text-zinc-800', bg: 'bg-zinc-50', border: 'border-zinc-800', light: 'bg-zinc-100', accent: 'text-zinc-900' },
};

interface Question {
  id: string;
  type: 'mcq' | 'boolean' | 'completion';
  text: string;
  options?: string[];
  answer: string | boolean;
  hint?: string;
}

const QUESTIONS: Record<Unit, Question[]> = {
  nutrition: [
    {
      id: 'n1',
      type: 'mcq',
      text: 'ما هي المادة التي تلون أوراق النبات باللون الأخضر وتمتص الضوء؟',
      options: ['الجلوكوز', 'الأمينو', 'الكلوروفيل', 'النشا'],
      answer: 'الكلوروفيل',
      hint: 'هذه المادة توجد داخل البلاستيدات الخضراء وتعتبر صبغة خضراء.'
    },
    {
      id: 'n2',
      type: 'mcq',
      text: 'المعادلة الكيميائية للجلوكوز هي:',
      options: ['C6H12O6', 'H2O', 'CO2', 'O2'],
      answer: 'C6H12O6',
      hint: 'راجع صفحة 17 من الكتاب، حيث يتكون من 6 ذرات كربون.'
    },
    {
      id: 'n3',
      type: 'mcq',
      text: 'ما هو الغاز الذي تطلبه النباتات للقيام بعملية التمثيل الضوئي؟',
      options: ['الأكسجين', 'النيتروجين', 'ثاني أكسيد الكربون', 'الهيدروجين'],
      answer: 'ثاني أكسيد الكربون',
      hint: 'يمتصه النبات من الهواء الجوي عبر الثغور.'
    },
    {
      id: 'n4',
      type: 'mcq',
      text: 'ماذا يحدث للنبات عند نقص عنصر المغنيسيوم؟',
      options: ['اصفرار الأوراق', 'موت الجذور', 'عدم نمو الثمار', 'سقوط الأزهار'],
      answer: 'اصفرار الأوراق',
      hint: 'المغنيسيوم ضروري لصنع الكلوروفيل، ونقصه يسبب شحوب اللون.'
    },
    {
      id: 'n5',
      type: 'mcq',
      text: 'أين تنتظم خلايا طبقة النسيج المتوسط العمادي لامتصاص أكبر قدر من الضوء؟',
      options: ['بشكل عشوائي', 'بشكل أفقي', 'بشكل عمودي أسفل البشرة العليا', 'داخل الجذور'],
      answer: 'بشكل عمودي أسفل البشرة العليا',
      hint: 'توجد هذه الطبقة في ورقة النبات وتتميز بكثرة البلاستيدات.'
    },
    {
      id: 'n6',
      type: 'mcq',
      text: 'ما هو المحلول المستخدم للكشف عن وجود النشا في ورقة النبات؟',
      options: ['محلول بندكت', 'محلول اليود', 'الكحول الإيثيلي', 'الماء المقطر'],
      answer: 'محلول اليود',
      hint: 'يتحول لونه إلى الأزرق الداكن عند وجود النشا.'
    },
    {
      id: 'n7',
      type: 'mcq',
      text: 'لماذا تخزن النباتات الجلوكوز الزائد على شكل نشا؟',
      options: ['لأنه يذوب بسرعة', 'لأنه غير قابل للذوبان في الماء', 'لأنه يعطي طاقة أقل', 'لأنه يحتاج لضوء'],
      answer: 'لأنه غير قابل للذوبان في الماء',
      hint: 'هذا يمنع النشا من التأثير على توازن الماء داخل الخلايا (الخاصية الأسموزية).'
    },
    {
      id: 'n8',
      type: 'mcq',
      text: 'ما هي الطبقة الشمعية التي تغطي سطح الورقة لتقليل فقد الماء؟',
      options: ['البشرة', 'الثغور', 'الكيوتيكل', 'الخشب'],
      answer: 'الكيوتيكل',
      hint: 'هي طبقة غير منفذة للماء تحمي الورقة.'
    },
    {
      id: 'n9',
      type: 'mcq',
      text: 'في أي جزء من الخلية النباتية تحدث عملية التمثيل الضوئي؟',
      options: ['النواة', 'الميتوكوندريا', 'البلاستيدات الخضراء', 'الفجوة العصارية'],
      answer: 'البلاستيدات الخضراء',
      hint: 'تحتوي على صبغة الكلوروفيل اللازمة لامتصاص الضوء.'
    },
    {
      id: 'n10',
      type: 'mcq',
      text: 'ما هو الناتج الرئيسي لعملية التمثيل الضوئي الذي يستخدمه النبات؟',
      options: ['الأكسجين', 'الجلوكوز', 'ثاني أكسيد الكربون', 'الماء'],
      answer: 'الجلوكوز',
      hint: 'هو السكر البسيط الذي يمثل طاقة الغذاء.'
    }
  ],
  digestion: [
    {
      id: 'd1',
      type: 'mcq',
      text: 'أين يبدأ هضم المواد الكربوهيدراتية (النشوية) في جسم الإنسان؟',
      options: ['المعدة', 'الأمعاء الدقيقة', 'الفم', 'المريء'],
      answer: 'الفم',
      hint: 'يحتوي اللعاب على إنزيم الأميليز الذي يبدأ هذه العملية.'
    },
    {
      id: 'd2',
      type: 'mcq',
      text: 'ما هو الوسط الذي يعمل فيه إنزيم الببسين بكفاءة عالية؟',
      options: ['الوسط المتعادل', 'الوسط القلوي', 'الوسط الحمضي بالمعدة', 'الوسط المائي'],
      answer: 'الوسط الحمضي بالمعدة',
      hint: 'المعدة تفرز حمض الهيدروكلوريك لتوفير هذا الوسط.'
    },
    {
      id: 'd3',
      type: 'mcq',
      text: 'ماذا تسمى عملية طرح الطعام غير المهضوم خارج الجسم عبر الشرج؟',
      options: ['الابتلاع', 'الهضم الكيميائي', 'التبرز', 'الامتصاص'],
      answer: 'التبرز',
      hint: 'المصطلح العلمي بالإنجليزية هو Egestion.'
    },
    {
      id: 'd4',
      type: 'mcq',
      text: 'ما هو الإنزيم المسؤول عن هضم الدهون؟',
      options: ['الأميليز', 'اللايبيز', 'المالتيز', 'الببسين'],
      answer: 'اللايبيز',
      hint: 'يفرزه البنكرياس ويعمل في الأمعاء الدقيقة.'
    },
    {
      id: 'd5',
      type: 'mcq',
      text: 'ما وظيفة الخملات في جدار الأمعاء الدقيقة؟',
      options: ['طحن الطعام', 'قتل البكتيريا', 'زيادة مساحة سطح الامتصاص', 'إفراز اللعاب'],
      answer: 'زيادة مساحة سطح الامتصاص',
      hint: 'مفردها خملة، وهي غنية بالشعيرات الدموية.'
    },
    {
      id: 'd6',
      type: 'mcq',
      text: 'أين يتم امتصاص معظم الماء في القناة الهضمية؟',
      options: ['الفم', 'المعدة', 'الأمعاء الغليظة', 'المريء'],
      answer: 'الأمعاء الغليظة',
      hint: 'هذا الجزء يحول الفضلات السائلة إلى فضلات صلبة.'
    },
    {
      id: 'd7',
      type: 'mcq',
      text: 'ما هي وظيفة العصارة الصفراوية؟',
      options: ['هضم النشا', 'قتل الميكروبات', 'استحلاب الدهون', 'إفراز الأنسولين'],
      answer: 'استحلاب الدهون',
      hint: 'تفرز من الكبد وتخزن في الحويصلة الصفراوية.'
    },
    {
      id: 'd8',
      type: 'mcq',
      text: 'ما هو الإنزيم الذي يهضم البروتينات في الأمعاء الدقيقة؟',
      options: ['التربسين', 'الأميليز', 'المالتيز', 'اللايبيز'],
      answer: 'التربسين',
      hint: 'يفرزه البنكرياس ويحول البروتينات إلى ببتيدات وأحماض أمينية.'
    },
    {
      id: 'd9',
      type: 'mcq',
      text: 'ما هو العضو الذي يفرز إنزيمات لهضم الكربوهيدرات والبروتينات والدهون معاً؟',
      options: ['الكبد', 'المعدة', 'البنكرياس', 'المرارة'],
      answer: 'البنكرياس',
      hint: 'يصب عصارته في الإثنا عشر (بداية الأمعاء الدقيقة).'
    },
    {
      id: 'd10',
      type: 'mcq',
      text: 'أين توجد الأوعية اللبنية (اللمفاوية) في الجهاز الهضمي؟',
      options: ['في المعدة', 'داخل الخملات', 'في المريء', 'في القولون'],
      answer: 'داخل الخملات',
      hint: 'تعمل على امتصاص الأحماض الدهنية والجليسرول.'
    }
  ],
  transport: [
    {
      id: 't1',
      type: 'mcq',
      text: 'ما هو النسيج المسؤول عن نقل الماء والأملاح المعدنية؟',
      options: ['اللحاء', 'الخشب', 'النخاع', 'القشرة'],
      answer: 'الخشب',
      hint: 'يتكون من أنابيب ميتة ومجوفة ومدعمة باللجنين.'
    },
    {
      id: 't2',
      type: 'mcq',
      text: 'ما هو تعريف عملية الانتقال (Translocation)؟',
      options: ['نقل الماء فقط', 'نقل السكروز في اللحاء', 'تبخر الماء من الأوراق', 'امتصاص الأملاح'],
      answer: 'نقل السكروز في اللحاء',
      hint: 'يتم النقل من المنبع (الأوراق) إلى المصب (أجزاء النمو).'
    },
    {
      id: 't3',
      type: 'mcq',
      text: 'ماذا تسمى عملية فقد الماء من أوراق النبات على شكل بخار؟',
      options: ['التنفس', 'النتح', 'الانتقال', 'التمثيل'],
      answer: 'النتح',
      hint: 'تحدث غالباً عبر الثغور الموجودة في الأوراق.'
    },
    {
      id: 't4',
      type: 'mcq',
      text: 'أي الأجزاء تزيد من مساحة سطح الجذر لامتصاص الماء؟',
      options: ['القلنسوة', 'القشرة', 'الشعيرات الجذرية', 'أوعية الخشب'],
      answer: 'الشعيرات الجذرية',
      hint: 'امتدادات دقيقة لخلايا البشرة في الجذر.'
    },
    {
      id: 't5',
      type: 'mcq',
      text: 'بأي خاصية ينتقل الماء من التربة إلى الشعيرات الجذرية؟',
      options: ['الخاصية الأسموزية', 'النقل النشط', 'الجاذبية', 'الضغط الميكانيكي'],
      answer: 'الخاصية الأسموزية',
      hint: 'يكون جهد الماء في التربة أعلى منه داخل الخلية.'
    },
    {
      id: 't6',
      type: 'mcq',
      text: 'ما هي القوة الرئيسية لسحب الماء للأعلى؟',
      options: ['الجاذبية', 'ضغط الجذور', 'قوة سحب النتح', 'التمثيل الضوئي'],
      answer: 'قوة سحب النتح',
      hint: 'تنتج عن تبخر الماء من الأوراق.'
    },
    {
      id: 't7',
      type: 'mcq',
      text: 'ما وظيفة أنابيب اللحاء في النبات؟',
      options: ['نقل الماء', 'نقل الغذاء الجاهز (السكروز)', 'تدعيم الساق القوي', 'امتصاص الضوء'],
      answer: 'نقل الغذاء الجاهز (السكروز)',
      hint: 'تحتوي على أنابيب غربالية وخلايا مرافقة.'
    },
    {
      id: 't8',
      type: 'mcq',
      text: 'ما هي المادة التي تترسب في جدران أوعية الخشب لتقويتها؟',
      options: ['السليلوز', 'الجليكوجين', 'اللجنين', 'البيكتين'],
      answer: 'اللجنين',
      hint: 'مادة خشبية قوية تجعل الأنابيب صلبة.'
    },
    {
      id: 't9',
      type: 'mcq',
      text: 'كيف تتأثر عملية النتح بالرطوبة الجوية العالية؟',
      options: ['تزداد سرعة النتح', 'يقل معدل النتح', 'تتوقف الجذور عن العمل', 'تتساقط الأوراق'],
      answer: 'يقل معدل النتح',
      hint: 'الرطوبة العالية تقلل من معدل تبخر الماء من الأوراق.'
    },
    {
      id: 't10',
      type: 'mcq',
      text: 'ماذا تسمى الحزم التي تحتوي على الخشب واللحاء؟',
      options: ['الحزم العضلية', 'الحزم الوعائية', 'النخاع', 'القشرة'],
      answer: 'الحزم الوعائية',
      hint: 'Vascular bundles.'
    }
  ],
  control: [
    {
      id: 'c1',
      type: 'mcq',
      text: 'ماذا يسمى نمو النبات استجابة لمنبه الضوء؟',
      options: ['انتحاء أرضي', 'انتحاء ضوئي', 'استجابة حركية', 'تمثيل ضوئي'],
      answer: 'انتحاء ضوئي',
      hint: 'Phototropism هو المصطلح العلمي لهذه الاستجابة.'
    },
    {
      id: 'c2',
      type: 'mcq',
      text: 'ما هو الهرمون النباتي المسؤول عن استطالة الخلايا؟',
      options: ['الأوكسين', 'الأنسولين', 'ثاني أكسيد الكربون', 'الكلوروفيل'],
      answer: 'الأوكسين',
      hint: 'يصنع في القمة النامية للساق وينتقل لأسفل.'
    },
    {
      id: 'c3',
      type: 'mcq',
      text: 'أين يتجمع الأوكسين عندما يتعرض الساق للضوء من جانب واحد؟',
      options: ['في الجانب المضيء', 'في الجانب المظلم', 'في مركز الساق', 'في الجذور فقط'],
      answer: 'في الجانب المظلم',
      hint: 'الأوكسين يهرب من الضوء ويحفز الاستطالة في الجانب المظلل.'
    },
    {
      id: 'c4',
      type: 'mcq',
      text: 'أي جهاز يستخدم لإلغاء تأثير الجاذبية في تجارب النمو؟',
      options: ['البوتومتر', 'المجهر', 'الكلينوستات', 'الترمومتر'],
      answer: 'الكلينوستات',
      hint: 'يستخدم لدراسة الانتحاء الأرضي.'
    },
    {
      id: 'c5',
      type: 'mcq',
      text: 'ما تعريف المنبه في الكائن الحي؟',
      options: ['النمو السريع', 'التغير في البيئة المسبب للاستجابة', 'مصدر الغذاء', 'لون النبات'],
      answer: 'التغير في البيئة المسبب للاستجابة',
      hint: 'مثل الضوء أو الجاذبية أو الحرارة.'
    },
    {
      id: 'c6',
      type: 'mcq',
      text: 'كيف تستجيب الجذور والسيقان للجاذبية الأرضية؟',
      options: ['كلاهما ينمو لأسفل', 'الجذور لأسفل والسيقان لأعلى', 'السيقان لأسفل والجذور لأعلى', 'كلاهما ينمو لأعلى'],
      answer: 'الجذور لأسفل والسيقان لأعلى',
      hint: 'الجذور تظهر انتحاءً أرضياً إيجابياً والسيقان سلبياً.'
    },
    {
      id: 'c7',
      type: 'mcq',
      text: 'أين يتم إنتاج الأوكسين بشكل رئيسي؟',
      options: ['في الجذور القديمة', 'في القمم النامية', 'في الثمار فقط', 'في اللحاء'],
      answer: 'في القمم النامية',
      hint: 'ينتج في قمة الساق وأطراف الجذور.'
    },
    {
      id: 'c8',
      type: 'mcq',
      text: 'ما معنى الانتحاء الأرضي الإيجابي؟',
      options: ['النمو بعيداً عن الجاذبية', 'النمو باتجاه الجاذبية', 'النمو نحو الضوء', 'توقف النمو'],
      answer: 'النمو باتجاه الجاذبية',
      hint: 'إيجابي يعني باتجاه المنبه (الجاذبية الأرضية).'
    },
    {
      id: 'c9',
      type: 'mcq',
      text: 'ما أثر الضوء الجانبي على انحناء الساق؟',
      options: ['تنمو مستقيمة', 'تنحني بعيداً عن الضوء', 'تنحني نحو الضوء', 'تموت الخلايا'],
      answer: 'تنحني نحو الضوء',
      hint: 'بسبب زيادة استطالة الخلايا في الجانب المظلل.'
    },
    {
      id: 'c10',
      type: 'mcq',
      text: 'ما هو المصطلح العلمي لانحناء النبات نحو الجاذبية؟',
      options: ['الانتحاء الضوئي', 'التمثيل الضوئي', 'الانتحاء الأرضي', 'النتح'],
      answer: 'الانتحاء الأرضي',
      hint: 'Gravitropism.'
    }
  ]
};

const UNIT_METADATA: Record<Unit, { name: string, icon: any, theme: ThemeColor }> = {
  nutrition: { name: 'التغذية في النبات', icon: Leaf, theme: 'emerald' },
  digestion: { name: 'الهضم في الإنسان', icon: Container, theme: 'blue' },
  transport: { name: 'النقل في النبات', icon: Activity, theme: 'amber' },
  control: { name: 'التحكم والتنظيم', icon: BrainCircuit, theme: 'purple' },
};

export default function App() {
  const [activeTheme, setActiveTheme] = useState<ThemeColor>('emerald');
  const [step, setStep] = useState<Step>('participants');
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantsInput, setParticipantsInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string, fact?: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isGeneratingFact, setIsGeneratingFact] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const units: Unit[] = ['nutrition', 'digestion', 'transport', 'control'];

  useEffect(() => {
    if (step === 'quiz' && timeLeft > 0 && !feedback?.isCorrect) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !feedback && step === 'quiz') {
      handleTimeout();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft, feedback]);

  const handleTimeout = () => {
    setFeedback({
      isCorrect: false,
      message: 'انتهى الوقت! حاول التركيز أكثر في المرة القادمة.'
    });
    setShowHint(true);
  };

  const backToUnits = () => {
    setStep('unitSelection');
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setRotation(0);
    setActivePlayer(null);
    setTimeLeft(30);
    // Theme will stay as what unit was selected or user can change
  };

  const backToHome = () => {
    setStep('participants');
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setRotation(0);
    setActivePlayer(null);
    setParticipants([]);
    setParticipantsInput('');
    setTimeLeft(30);
    setActiveTheme('emerald');
  };

  const handleSpin = () => {
    if (isSpinning || participants.length === 0) return;
    
    setIsSpinning(true);
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const randomAngle = Math.random() * 360;
    const newRotation = rotation + (extraSpins * 360) + randomAngle;
    setRotation(newRotation);

    setTimeout(() => {
      const segmentSize = 360 / participants.length;
      // Normalizing rotation to 0-360
      const actualRotation = newRotation % 360;
      // Adjusted calculation: align with segment center at -90deg visually
      const winningIndex = Math.floor(((360 - actualRotation + segmentSize / 2) % 360) / segmentSize) % participants.length;
      
      setActivePlayer(participants[winningIndex]);
      setIsSpinning(false);
      
      setTimeout(() => {
        setStep('quiz');
        setTimeLeft(30);
      }, 1500);
    }, 4000);
  };

  const generateFact = useCallback(async (question: string) => {
    setIsGeneratingFact(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `أنت خبير أحياء لمنهج سلطنة عمان. بناءً على السؤال التالي: "${question}"، أعطني معلومة إضافية مشوقة "هل تعلم؟" باللغة العربية تكون قصيرة ومفيدة جداً للطالب في الصف التاسع. لا تزد عن جملة واحدة أو جملتين.`,
      });
      return response.text;
    } catch (error) {
      return "هل تعلم أن النباتات توفر الأكسجين الضروري للحياة على كوكبنا؟";
    } finally {
      setIsGeneratingFact(false);
    }
  }, []);

  const currentQuestions = selectedUnit ? QUESTIONS[selectedUnit] : [];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleContinueToUnits = () => {
    const names = participantsInput.split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
    
    if (names.length > 0) {
      setParticipants(names);
      setStep('unitSelection');
    }
  };

  const handleSubmit = async (providedAnswer?: string) => {
    if (!currentQuestion) return;
    
    const answerToTest = providedAnswer || userAnswer;
    if (!answerToTest && currentQuestion.type !== 'boolean') return;

    let correct = false;
    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'completion') {
      correct = answerToTest.trim().toLowerCase() === String(currentQuestion.answer).toLowerCase();
    } else if (currentQuestion.type === 'boolean') {
      correct = (answerToTest === 'صحيح' && currentQuestion.answer === true) || 
                (answerToTest === 'خطأ' && currentQuestion.answer === false);
    }

    if (correct) {
      if (timerRef.current) clearInterval(timerRef.current);
      const fact = await generateFact(currentQuestion.text);
      setFeedback({ 
        isCorrect: true, 
        message: `إجابة رائعة يا ${activePlayer}! أنت متميز.`,
        fact: fact
      });
      setScore(s => s + 1);
    } else {
      setFeedback({ 
        isCorrect: false, 
        message: 'إجابة غير دقيقة. حاول مرة أخرى!',
      });
      setShowHint(true);
    }
  };

  const theme = THEME_MAP[activeTheme];

  const handleNext = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex(i => i + 1);
      setFeedback(null);
      setShowHint(false);
      setUserAnswer('');
      setStep('playerPicker'); 
      setRotation(0);
      setActivePlayer(null);
    } else {
      setStep('result');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 overflow-x-hidden">
      <header className="w-full max-w-4xl flex flex-col items-center py-6 relative">
        <div className="absolute top-6 left-0 hidden md:flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-zinc-100">
          <Palette className="w-5 h-5 text-zinc-400" />
          {Object.entries(THEME_MAP).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => setActiveTheme(name as ThemeColor)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${colors.primary} ${activeTheme === name ? 'border-zinc-800 scale-125' : 'border-transparent hover:scale-110'}`}
              title={name}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`inline-block ${theme.primary} text-white px-6 py-2 rounded-full mb-4 font-bold shadow-lg`}
        >
          مختبر الأحياء التفاعلي 🧬
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-black text-zinc-800">مسابقة الصف التاسع</h1>
        
        <div className="flex md:hidden items-center gap-2 mt-4 bg-white p-2 rounded-2xl shadow-sm border border-zinc-100">
          <Palette className="w-4 h-4 text-zinc-400" />
          {Object.entries(THEME_MAP).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => setActiveTheme(name as ThemeColor)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${colors.primary} ${activeTheme === name ? 'border-zinc-800 scale-125' : 'border-transparent'}`}
            />
          ))}
        </div>
      </header>

      <main className="w-full max-w-4xl flex-grow flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 'participants' && (
            <motion.div 
              key="participants"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full bg-white rounded-3xl p-8 shadow-xl border border-zinc-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className={`w-8 h-8 ${theme.text}`} />
                <h2 className="text-2xl font-bold italic">سجلوا أسماء المشاركين (كل اسم في سطر):</h2>
              </div>
              
              <div className="mb-8">
                <textarea 
                  value={participantsInput}
                  onChange={(e) => setParticipantsInput(e.target.value)}
                  placeholder="سجل الأسماء هنا (كل اسم في سطر جديد)..."
                  className={`w-full h-64 p-6 rounded-2xl border-2 border-zinc-100 focus:${theme.border} outline-none transition-all text-xl font-bold font-arabic resize-none leading-loose bg-zinc-50/50 shadow-inner`}
                />
                <div className="mt-2 text-zinc-400 text-sm flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>عدد الأسماء المكتشفة: {participantsInput.split('\n').filter(n => n.trim() !== '').length}</span>
                </div>
              </div>

              <button
                disabled={!participantsInput.trim()}
                onClick={handleContinueToUnits}
                className={`w-full ${theme.primary} text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 disabled:opacity-50 ${theme.hover} transition-all shadow-lg active:scale-95`}
              >
                <Play className="w-6 h-6" />
                المتابعة لاختيار الوحدة
              </button>
            </motion.div>
          )}

          {step === 'unitSelection' && (
            <motion.div 
              key="unitSelection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
            >
              <div className="col-span-full flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-zinc-800">اختر الوحدة:</h2>
                <button 
                  onClick={backToHome}
                  className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2 font-bold text-zinc-500"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>الرئيسية</span>
                </button>
              </div>
              {units.map((unit) => {
                const meta = UNIT_METADATA[unit];
                const Icon = meta.icon;
                return (
                  <button
                    key={unit}
                    onClick={() => {
                      setSelectedUnit(unit);
                      setActiveTheme(meta.theme);
                      setStep('playerPicker');
                    }}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl hover:scale-105 transition-all text-white ${THEME_MAP[meta.theme].primary}`}
                  >
                    <Icon className="w-16 h-16 mb-4" />
                    <span className="text-2xl font-black">{meta.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {step === 'playerPicker' && (
            <motion.div 
              key="playerPicker"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full flex flex-col items-center relative"
            >
              <div className="absolute top-0 right-0 flex flex-col gap-2 z-10">
                <button 
                  onClick={backToUnits}
                  className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 hover:bg-zinc-100 transition-all text-zinc-500"
                  title="تغيير الوحدة"
                >
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
                <button 
                  onClick={backToHome}
                  className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 hover:bg-red-50 hover:text-red-500 transition-all text-zinc-500"
                  title="العودة للرئيسية"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
              </div>
              <div className="relative mb-12">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                  <motion.div 
                    animate={isSpinning ? { y: [0, -5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    className="w-10 h-10 bg-accent rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6 text-white rotate-90" />
                  </motion.div>
                </div>

                <motion.div 
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.13, 0.99, 0.29, 1.0] }}
                  className="w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-white shadow-2xl relative overflow-hidden bg-white"
                >
                  {participants.map((name, i) => {
                    const angle = 360 / participants.length;
                    const rotate = i * angle;
                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];
                    return (
                      <div 
                        key={`${name}-${i}`}
                        className="absolute w-full h-full"
                        style={{ 
                           backgroundColor: colors[i % colors.length],
                           clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotate - angle/2 - 90.01) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate - angle/2 - 90.01) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotate + angle/2 - 89.99) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotate + angle/2 - 89.99) * Math.PI / 180)}%)`,
                           transformOrigin: '50% 50%',
                        }}
                      >
                        <div 
                          className="absolute w-full text-center text-white font-bold"
                          style={{ 
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${rotate}deg) translateY(-120px) rotate(0deg)`,
                            fontSize: participants.length > 10 ? '0.75rem' : '1.1rem',
                            maxWidth: '120px'
                          }}
                        >
                          <span className="block px-2 break-words drop-shadow-md">{name}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full border-4 border-zinc-50 flex items-center justify-center shadow-lg z-10">
                      <div className={`w-2 h-2 ${theme.primary} rounded-full`} />
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 max-w-lg mb-8 relative">
                <h2 className="text-2xl font-bold mb-4">من سيجيب على السؤال التالي؟</h2>
                <AnimatePresence>
                  {activePlayer && (
                    <motion.div 
                      key="active-player"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.2 }}
                      className={`text-4xl font-black ${theme.text} mb-6`}
                    >
                      🎉 {activePlayer} 🎉
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className={`w-full ${theme.primary} ${theme.hover} text-white py-6 rounded-2xl text-2xl font-black shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:grayscale`}
                >
                  {isSpinning ? 'جاري اختيار الطالب...' : 'لف عجلة الأسماء! 🎡'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'quiz' && currentQuestion && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button 
                  onClick={backToUnits}
                  className="bg-white/80 backdrop-blur p-2 rounded-xl border border-zinc-100 hover:bg-zinc-100 transition-all text-zinc-500"
                  title="تغيير الوحدة"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
                <button 
                  onClick={backToHome}
                  className="bg-white/80 backdrop-blur p-2 rounded-xl border border-zinc-100 hover:bg-red-50 hover:text-red-500 transition-all text-zinc-500"
                  title="العودة للرئيسية"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 30) * 100}%` }}
                  className={`h-full ${timeLeft < 10 ? 'bg-red-500' : theme.primary}`}
                />
              </div>

              <div className="flex justify-between items-center mb-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`${theme.bg} p-2 rounded-lg`}>
                    <User className={`w-6 h-6 ${theme.text}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-bold text-right">المجيب الحالي:</span>
                    <span className={`font-black ${theme.accent} text-xl`}>{activePlayer}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className={`flex items-center gap-2 font-black text-2xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-zinc-700'}`}>
                    <Timer className="w-6 h-6" />
                    <span>{timeLeft.toString().padStart(2, '0')} ثانية</span>
                  </div>
                </div>
              </div>

              <div className={`bg-zinc-50 p-6 rounded-2xl mb-8 border-r-4 ${theme.border}`}>
                <h3 className="text-2xl font-bold text-zinc-800 leading-relaxed italic">
                  "{currentQuestion.text}"
                </h3>
              </div>

              <div className="space-y-4 mb-8">
                {currentQuestion.type === 'mcq' && currentQuestion.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (!feedback) {
                        setUserAnswer(opt);
                        handleSubmit(opt);
                      }
                    }}
                    disabled={feedback !== null}
                    className={`w-full text-right p-5 rounded-2xl border-2 transition-all text-lg flex justify-between items-center ${
                      userAnswer === opt 
                        ? (feedback?.isCorrect ? `${theme.bg} ${theme.border} ${theme.accent} font-bold shadow-sm` : 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm')
                        : feedback && opt === currentQuestion.answer
                          ? `${theme.bg} border-${activeTheme}-200 ${theme.text} font-bold`
                          : 'border-zinc-100 hover:border-zinc-200 text-zinc-700 bg-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {userAnswer === opt && feedback && (
                      feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </button>
                ))}
              </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-6 rounded-2xl overflow-hidden ${
                        feedback.isCorrect ? `${theme.bg} ${theme.accent}` : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <span className="font-bold text-lg">{feedback.message}</span>
                      </div>
                      
                      {feedback.isCorrect ? (
                        <div className={`mt-4 border-t border-${activeTheme}-200 pt-4`}>
                          <div className={`flex items-center gap-2 font-bold mb-2 ${theme.text}`}>
                            <Lightbulb className="w-5 h-5" />
                            <span>معلومة من الكتاب:</span>
                          </div>
                          <p className={`italic ${theme.accent}`}>
                            {isGeneratingFact ? 'لحظة.. جاري تحليل السؤال...' : feedback.fact}
                          </p>
                          <button
                            onClick={handleNext}
                            className={`mt-6 w-full ${theme.primary} text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm ${theme.hover} transition-all`}
                          >
                            اختيار الشخص التالي
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 border-t border-red-200 pt-4">
                          <p className="text-red-700 mb-4 font-medium italic">الإجابة الصحيحة كانت: {currentQuestion.answer}</p>
                          <button
                            onClick={handleNext}
                            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-red-700 transition-all"
                          >
                            تجاوز واختيار الشخص التالي
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {!feedback.isCorrect && (timeLeft === 0 || showHint) && (
                        <div className="mt-4">
                           {currentQuestion.hint && (
                            <div className="bg-white/50 p-4 rounded-xl flex items-start gap-2 mb-4">
                              <HelpCircle className="w-5 h-5 text-red-500 mt-1" />
                              <p className="text-red-700">تلميح لمساعدتك: {currentQuestion.hint}</p>
                            </div>
                           )}
                           <button
                            onClick={handleNext}
                            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold"
                          >
                            تخطي والانتقال لشخص آخر
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-sm border border-zinc-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-zinc-800" />
              <Trophy className="w-20 h-20 text-accent mx-auto mb-6" />
              
              <h2 className="text-3xl font-black text-zinc-800 mb-2">أحسنت العمل!</h2>
              <p className="text-zinc-500 mb-8 font-medium">نتائج المسابقة في وحدة: <span className={`${theme.text} font-bold`}>{selectedUnit && UNIT_METADATA[selectedUnit].name}</span></p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className={`${theme.bg} p-6 rounded-2xl border border-${activeTheme}-100`}>
                  <div className={`${theme.text} font-black text-3xl mb-1`}>{score}</div>
                  <div className={`${theme.accent} text-sm font-bold`}>صحيحة</div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <div className="text-red-600 font-black text-3xl mb-1">{currentQuestions.length - score}</div>
                  <div className="text-red-700 text-sm font-bold">خاطئة</div>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="text-blue-600 font-black text-3xl mb-1">
                    {Math.round((score / currentQuestions.length) * 100)}%
                  </div>
                  <div className="text-blue-700 text-sm font-bold">النسبة</div>
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl mb-10 border border-zinc-100 italic font-medium text-zinc-700">
                {score === currentQuestions.length ? (
                  "يا مذهل! لقد أجبت على كل الأسئلة بشكل صحيح. أنت عبقري أحياء حقيقي! 🌟"
                ) : score >= currentQuestions.length * 0.7 ? (
                  "رائع جداً! مستواك ممتاز ومعلوماتك قوية، استمر في هذا التفوق. 👏"
                ) : score >= currentQuestions.length * 0.5 ? (
                  "جيد! لديك معلومات جيدة ولكنك تحتاج لمزيد من التركيز والمراجعة لتصبح الأفضل. 👍"
                ) : (
                  "لا بأس، المحاولة بحد ذاتها نجاح! راجع دروسك جيداً وحاول مرة أخرى، فنحن نتعلم من أخطائنا. 💪"
                )}
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={backToUnits}
                  className="w-full bg-zinc-800 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-900 shadow-sm transition-all"
                >
                  <RotateCcw className="w-6 h-6" />
                  اختيار وحدة أخرى (نفس الفريق)
                </button>
                <button
                  onClick={backToHome}
                  className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-700 shadow-sm transition-all"
                >
                  <RotateCcw className="w-6 h-6" />
                  الخروج للرئيسية ومسح الأسماء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-4xl text-center py-8 text-zinc-400 font-bold">
        &copy; {new Date().getFullYear()} مختبر الأحياء التفاعلي - سلطنة عمان
      </footer>
    </div>
  );
}
