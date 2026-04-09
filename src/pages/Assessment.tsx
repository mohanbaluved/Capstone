import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx";
import { Button } from "../components/ui/button.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../lib/supabase.ts";
import { Problem, IntegrityData } from "../types/index.ts";
import { Clock, AlertTriangle, Send, Code, FileText, MessageSquare } from "lucide-react";

const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Submission state
  const [pseudoCode, setPseudoCode] = useState("");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [language, setLanguage] = useState("javascript");
  
  // Integrity state
  const [integrity, setIntegrity] = useState<IntegrityData>({
    pasteCount: 0,
    tabSwitchCount: 0,
    idleTime: 0,
    aiCalls: 0,
  });
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const idleRef = useRef<number>(0);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await axios.get("/api/assessments/problems/next", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.data) {
          toast.error("No problems available at the moment.");
          return;
        }
        
        setProblem(res.data);
      } catch (error) {
        console.error("Error fetching problem:", error);
        toast.error("Failed to load problem. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProblem();

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
      idleRef.current += 1;
    }, 1000);

    // Integrity tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIntegrity(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount + 1 }));
        toast.warning("Tab switch detected. This affects your integrity score.");
      }
    };

    const handlePaste = () => {
      setIntegrity(prev => ({ ...prev, pasteCount: prev.pasteCount + 1 }));
      toast.warning("Paste detected. This affects your integrity score.");
    };

    const resetIdle = () => {
      if (idleRef.current > 60) {
        setIntegrity(prev => ({ ...prev, idleTime: prev.idleTime + idleRef.current }));
      }
      idleRef.current = 0;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("mousemove", resetIdle);
    document.addEventListener("keydown", resetIdle);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("mousemove", resetIdle);
      document.removeEventListener("keydown", resetIdle);
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!code || !explanation) {
      toast.error("Please provide both code and explanation.");
      return;
    }

    setSubmitting(true);
    console.log("Submitting assessment...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const timeLimit = 1800;
      const timeTaken = timeLimit - timeLeft;
      const timedOut = timeLeft === 0;

      const submissionData = {
        problem,
        problemId: problem?.id,
        problemTitle: problem?.title,
        pseudoCode,
        code,
        explanation,
        language,
        integrity: {
          ...integrity,
          idleTime: integrity.idleTime + idleRef.current
        },
        timeTaken,
        timeLimit,
        timedOut
      };

      console.log("Submission data:", submissionData);

      const res = await axios.post("/api/assessments/submit", submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Submission response:", res.data);
      toast.success("Assessment submitted successfully!");
      navigate(`/results/${res.data.id}`);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-96">Loading problem...</div></Layout>;
  if (!problem) return <Layout><div className="flex items-center justify-center h-96">No problem found.</div></Layout>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
        {/* Left: Problem Description */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4">
          <div className="flex items-center justify-between">
            <Badge variant={problem.difficulty === 'Easy' ? 'secondary' : problem.difficulty === 'Medium' ? 'default' : 'destructive'}>
              {problem.difficulty}
            </Badge>
            <div className={`flex items-center gap-2 font-mono text-sm ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`}>
              <Clock className="w-4 h-4" />
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <p className="text-neutral-500 text-sm mt-1">{problem.topic}</p>
          </div>

          <div className="prose prose-sm max-w-none text-neutral-700">
            <p className="whitespace-pre-wrap">{problem.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500">Constraints</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-600">
              {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500">Examples</h3>
            {problem.examples.map((ex, i) => (
              <div key={i} className="bg-neutral-100 p-3 rounded-lg text-xs font-mono space-y-2">
                <p><span className="text-neutral-400">Input:</span> {ex.input}</p>
                <p><span className="text-neutral-400">Output:</span> {ex.output}</p>
                {ex.explanation && <p><span className="text-neutral-400">Explanation:</span> {ex.explanation}</p>}
              </div>
            ))}
          </div>

          {integrity.tabSwitchCount > 0 && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
              <p className="text-xs text-red-700">
                Multiple tab switches detected. Your integrity score is being penalized.
              </p>
            </div>
          )}
        </div>

        {/* Right: Coding Interface */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <Tabs defaultValue="code" className="flex-1 flex flex-col">
            <div className="px-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="pseudo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Pseudo-code
                </TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Code className="w-4 h-4 mr-2" />
                  Implementation
                </TabsTrigger>
                <TabsTrigger value="explanation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Explanation
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs bg-transparent border-none focus:ring-0 font-medium"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="pseudo" className="h-full m-0">
                <Textarea 
                  placeholder="Outline your logic here..." 
                  className="h-full border-none focus-visible:ring-0 resize-none font-mono text-sm p-6"
                  value={pseudoCode}
                  onChange={(e) => setPseudoCode(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="code" className="h-full m-0">
                <Textarea 
                  placeholder="// Write your code here..." 
                  className="h-full border-none focus-visible:ring-0 resize-none font-mono text-sm p-6 bg-neutral-900 text-neutral-100 selection:bg-neutral-700"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="explanation" className="h-full m-0">
                <Textarea 
                  placeholder="Explain your approach, time complexity, and space complexity..." 
                  className="h-full border-none focus-visible:ring-0 resize-none font-sans text-sm p-6"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </TabsContent>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{code.length} characters</span>
                <span>{explanation.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-black hover:bg-neutral-800 px-8"
              >
                {submitting ? "Evaluating..." : "Submit Assessment"}
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentPage;
