import React from "react";
import Layout from "../components/layout/Layout.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { BookOpen, Play, CheckCircle } from "lucide-react";

const Learning: React.FC = () => {
  const modules = [
    {
      id: "m1",
      title: "Mastering Array Methods",
      description: "Learn how to use map, filter, reduce, and more to solve complex problems efficiently.",
      topic: "Arrays",
      difficulty: "Easy",
      status: "Recommended"
    },
    {
      id: "m2",
      title: "Understanding Big O Notation",
      description: "A deep dive into time and space complexity analysis for algorithm optimization.",
      topic: "Complexity",
      difficulty: "Medium",
      status: "In Progress"
    },
    {
      id: "m3",
      title: "Dynamic Programming Foundations",
      description: "Master the art of breaking down problems into smaller subproblems with memoization.",
      topic: "Logic",
      difficulty: "Hard",
      status: "Locked"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Center</h1>
          <p className="text-neutral-500">Adaptive modules tailored to your skill level and performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className={module.status === 'Locked' ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{module.topic}</Badge>
                  <Badge variant={module.status === 'Recommended' ? 'default' : 'secondary'}>
                    {module.status}
                  </Badge>
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-neutral-500">{module.difficulty}</span>
                  <Button disabled={module.status === 'Locked'} size="sm">
                    {module.status === 'In Progress' ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    ) : module.status === 'Locked' ? (
                      'Locked'
                    ) : (
                      'Start Module'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-neutral-900 text-white">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ready for a challenge?</h2>
              <p className="text-neutral-400 max-w-md">
                Our AI mentor has prepared a personalized assessment based on your recent activity in the "Arrays" module.
              </p>
              <Button className="bg-white text-black hover:bg-neutral-200">Take Assessment</Button>
            </div>
            <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-neutral-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Learning;
