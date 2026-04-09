import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Brain, Target, Shield, TrendingUp, ArrowRight, Award, History, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";
import { Assessment } from "../types/index.ts";
import { format } from "date-fns";

const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;
      console.log("Fetching assessments for user:", user.id);
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        console.log("Fetched assessments:", data);
        const mappedData = (data || []).map(item => ({
          id: item.id,
          userId: item.user_id,
          problemId: item.problem_id,
          problemTitle: item.problem_title,
          problem: item.problem,
          topic: item.topic,
          difficulty: item.difficulty,
          code: item.code,
          explanation: item.explanation,
          evaluation: item.evaluation,
          performanceScore: item.performance_score,
          trustWeight: item.trust_weight,
          createdAt: item.created_at
        } as Assessment));
        
        setAssessments(mappedData);
      } catch (err) {
        console.error("Error fetching assessments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [user]);

  const masteryData = profile?.topicMastery ? Object.entries(profile.topicMastery).map(([topic, score]) => ({
    subject: topic,
    A: score,
    fullMark: 100,
  })) : [
    { subject: 'Arrays', A: 0, fullMark: 100 },
    { subject: 'Strings', A: 0, fullMark: 100 },
    { subject: 'Logic', A: 0, fullMark: 100 },
    { subject: 'Complexity', A: 0, fullMark: 100 },
    { subject: 'Best Practices', A: 0, fullMark: 100 },
  ];

  const trendData = assessments.length > 0 
    ? assessments.slice().reverse().map((a, i) => ({
        name: `A${i+1}`,
        score: a.performanceScore
      }))
    : [
        { name: 'Start', score: 0 },
        { name: 'Current', score: profile?.skillScore || 0 },
      ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName}</h1>
            <p className="text-neutral-500">Track your progress and improve your coding skills with AI-driven insights.</p>
          </div>
          <Button onClick={() => navigate("/assessment")} size="lg" className="bg-black hover:bg-neutral-800">
            Start New Assessment
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Skill Score</p>
                  <h3 className="text-2xl font-bold">{Math.round(profile?.skillScore || 0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Brain className="text-blue-600 w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>{profile?.skillLevel}</span>
                  <span>Next: {profile?.skillLevel === 'Expert' ? 'Max' : 'Next Level'}</span>
                </div>
                <Progress value={profile?.skillScore} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Trust Weight</p>
                  <h3 className="text-2xl font-bold">{Math.round((profile?.trustWeight || 0) * 100)}%</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <Shield className="text-green-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Based on integrity and consistency</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Total Assessments</p>
                  <h3 className="text-2xl font-bold">{assessments.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <History className="text-purple-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Assessments completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Confidence</p>
                  <h3 className="text-2xl font-bold">{profile?.confidenceScore || 0}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="text-orange-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Submission quality metric</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Skill Mastery</CardTitle>
              <CardDescription>Topic-wise proficiency breakdown</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#737373' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#000"
                    fill="#000"
                    fillOpacity={0.1}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Skill Progression</CardTitle>
              <CardDescription>Performance across assessments</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#000" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Your latest technical evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-neutral-500">Loading assessments...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-100 rounded-2xl">
                <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No assessments yet</h3>
                <p className="text-neutral-500 mb-6">Complete your first assessment to see results here.</p>
                <Button onClick={() => navigate("/assessment")}>Start Now</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.slice(0, 5).map((a) => (
                  <div 
                    key={a.id} 
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-lg group-hover:bg-black group-hover:text-white transition-colors">
                        {a.evaluation.overallGrade || 'B'}
                      </div>
                      <div>
                        <p className="font-semibold">{a.problemTitle}</p>
                        <p className="text-xs text-neutral-400">{a.topic} • {a.difficulty} • {format(new Date(a.createdAt), 'MMM d, yyyy • h:mm a')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold">{Math.round(a.performanceScore)}/100</p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Score</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold">{Math.round(a.trustWeight * 100)}%</p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Trust</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                ))}
                {assessments.length > 5 && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => navigate("/history")}>
                    View All Assessments
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
