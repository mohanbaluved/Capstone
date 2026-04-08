import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout.tsx";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { ScrollArea } from "../components/ui/scroll-area.tsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { Assessment } from "../types/index.ts";
import { 
  CheckCircle2, AlertCircle, Lightbulb, BarChart3, 
  Code2, MessageSquare, ShieldAlert, ArrowLeft, Download
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "assessments", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAssessment({ id: docSnap.id, ...docSnap.data() } as Assessment);
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  if (loading) return <Layout><div className="flex items-center justify-center h-96">Loading results...</div></Layout>;
  if (!assessment) return <Layout><div className="flex items-center justify-center h-96">Assessment not found.</div></Layout>;

  const { evaluation, integrity } = assessment;

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `assessment_${id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportCSV = () => {
    const headers = ["Problem", "Date", "Performance", "Logic", "Code", "Communication", "Trust Weight"];
    const row = [
      assessment.problemTitle,
      new Date(assessment.timestamp).toLocaleDateString(),
      Math.round(evaluation.performance * 10),
      evaluation.logic_score,
      evaluation.code_score,
      evaluation.communication_score,
      Math.round((assessment.integrity as any).trustWeight * 100 || 100)
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + row.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assessment_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
              <p className="text-neutral-500">{assessment.problemTitle} • {new Date(assessment.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={() => navigate("/assessment")}>Try Another</Button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-black text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BarChart3 className="w-32 h-32" />
            </div>
            <CardContent className="pt-8 pb-10">
              <div className="space-y-6">
                <div>
                  <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Performance Score</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-bold">{Math.round(evaluation.performance * 10)}</h2>
                    <span className="text-neutral-500 text-xl">/ 100</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Logic</p>
                    <p className="text-lg font-semibold">{evaluation.logic_score}/10</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Code</p>
                    <p className="text-lg font-semibold">{evaluation.code_score}/10</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Comm.</p>
                    <p className="text-lg font-semibold">{evaluation.communication_score}/10</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-neutral-500">Integrity Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Tab Switches</span>
                <Badge variant={integrity.tabSwitchCount > 2 ? "destructive" : "secondary"}>{integrity.tabSwitchCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Paste Events</span>
                <Badge variant={integrity.pasteCount > 5 ? "destructive" : "secondary"}>{integrity.pasteCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Idle Time</span>
                <span className="text-sm font-mono">{Math.floor(integrity.idleTime / 60)}m {integrity.idleTime % 60}s</span>
              </div>
              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Trust weight applied to skill update</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="code">Your Submission</TabsTrigger>
            <TabsTrigger value="feedback">Strengths & Improvements</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    Correctness & Complexity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Correctness Score</span>
                    <span className="font-bold">{evaluation.analysis.correctness}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time Complexity</span>
                    <Badge variant="outline" className="font-mono">{evaluation.analysis.timeComplexity}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Space Complexity</span>
                    <Badge variant="outline" className="font-mono">{evaluation.analysis.spaceComplexity}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimal Solution</span>
                    <Badge variant={evaluation.analysis.isOptimal ? "default" : "secondary"}>
                      {evaluation.analysis.isOptimal ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="text-blue-500 w-5 h-5" />
                    Code Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(evaluation.quality || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs capitalize">
                        <span>{key}</span>
                        <span>{val}/10</span>
                      </div>
                      <Progress value={(val as number) * 10} className="h-1" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Card>
              <CardContent className="p-0">
                <div className="bg-neutral-900 text-neutral-100 p-6 rounded-t-xl font-mono text-sm overflow-x-auto">
                  <pre>{assessment.code}</pre>
                </div>
                <div className="p-6 border-t border-neutral-100">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Explanation
                  </h4>
                  <p className="text-neutral-600 text-sm whitespace-pre-wrap">{assessment.explanation}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-100 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-orange-50/30">
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {evaluation.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Results;
