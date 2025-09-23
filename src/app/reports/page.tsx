'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Workshop, Participant, Program, ProgramParticipant } from '@/types/product'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface WorkshopReport {
  workshop: Workshop
  statistics: {
    totalParticipants: number
    attendedParticipants: number
    noShowParticipants: number
    registeredParticipants: number
    attendanceRate: number
    specialStatus: {
      disabled: number
      wounded: number
      separated: number
      unaccompanied: number
    }
    ageGroups: {
      '0-17': number
      '18-35': number
      '36-55': number
      '56+': number
    }
  }
  participants: Participant[]
  materialDistribution: {
    [productName: string]: {
      totalQuantity: number
      participantCount: number
    }
  }
  transactions: any[]
}

interface ProgramReport {
  program: Program
  statistics: {
    totalEnrolledParticipants: number
    uniqueAttendees: number
    completedParticipants: number
    activeParticipants: number
    droppedOutParticipants: number
    eligibleForCompletion: number
    totalSessions: number
    completedSessions: number
    plannedSessions: number
    overallAttendanceRate: number
    completionRate: number
    retentionRate: number
    ageGroups: {
      '0-17': number
      '18-35': number
      '36-55': number
      '56+': number
    }
    genderDistribution: {
      male: number
      female: number
      other: number
    }
    specialStatus: {
      disabled: number
      wounded: number
      separated: number
      unaccompanied: number
    }
  }
  sessions: any[]
  participants: ProgramParticipant[]
  materialDistribution: {
    [productName: string]: {
      totalQuantity: number
      participantCount: number
      sessionCount: number
    }
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<WorkshopReport[]>([])
  const [programReports, setProgramReports] = useState<ProgramReport[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedProgramReportId, setSelectedProgramReportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [programLoading, setProgramLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'workshops' | 'programs'>('workshops')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchReports()
    fetchProgramReports()
  }, [session, status, router])

  async function fetchReports() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reports/workshops')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to fetch reports')
        return
      }
      setReports(data)
    } catch (err) {
      setError('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProgramReports() {
    setProgramLoading(true)
    try {
      const res = await fetch('/api/reports/programs')
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to fetch program reports:', data.error)
        return
      }
      setProgramReports(data)
    } catch (err) {
      console.error('Failed to fetch program reports')
    } finally {
      setProgramLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const selectedReport = reports.find(r => r.workshop._id === selectedReportId)
  const selectedProgramReport = programReports.find(r => r.program._id === selectedProgramReportId)

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">📊 Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into workshops, programs, and system usage
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-red-600">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-700"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'workshops' | 'programs')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workshops">📊 Workshop Reports</TabsTrigger>
          <TabsTrigger value="programs">📚 Program Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                Loading workshop reports...
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                No workshop reports available yet. Create some workshops to see reports here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Workshop List */}
              <Card>
                <CardHeader>
                  <CardTitle>Workshop Reports</CardTitle>
                  <CardDescription>Click on a workshop to view detailed report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {reports.map((report) => (
                      <Card
                        key={report.workshop._id}
                        className={`cursor-pointer transition-colors ${
                          report.workshop._id === selectedReportId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedReportId(report.workshop._id === selectedReportId ? null : report.workshop._id!)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">{report.workshop.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.workshop.date} | {report.workshop.location}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span>👥 {report.statistics.totalParticipants} participants</span>
                            <span>✅ {report.statistics.attendanceRate}% attendance</span>
                            <span>📦 {Object.keys(report.materialDistribution).length} materials</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Workshop Report */}
              {selectedReport && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>📊 {selectedReport.workshop.title} - Detailed Report</CardTitle>
                      <Button variant="outline" onClick={() => setSelectedReportId(null)}>
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overview Statistics */}
                    <div>
                      <h4 className="font-medium mb-3">📈 Overview Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-800">{selectedReport.statistics.totalParticipants}</div>
                            <div className="text-sm text-muted-foreground">Total Participants</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-700">{selectedReport.statistics.attendedParticipants}</div>
                            <div className="text-sm text-muted-foreground">Attended</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{selectedReport.statistics.attendanceRate}%</div>
                            <div className="text-sm text-muted-foreground">Attendance Rate</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{selectedReport.statistics.noShowParticipants}</div>
                            <div className="text-sm text-muted-foreground">No Shows</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Demographics and Status would continue here... */}
                    <div>
                      <h4 className="font-medium mb-3">👥 Age Demographics</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {Object.entries(selectedReport.statistics.ageGroups).map(([ageGroup, count]) => (
                          <Card key={ageGroup} className="bg-gray-50">
                            <CardContent className="p-3 text-center">
                              <div className="font-bold">{count}</div>
                              <div className="text-sm text-muted-foreground">{ageGroup} years</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          {programLoading ? (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                Loading program reports...
              </CardContent>
            </Card>
          ) : programReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                No program reports available yet. Create some programs to see reports here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Program List */}
              <Card>
                <CardHeader>
                  <CardTitle>Program Reports</CardTitle>
                  <CardDescription>
                    Click on a program to view detailed report with unique beneficiary counting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {programReports.map((report) => (
                      <Card
                        key={report.program._id}
                        className={`cursor-pointer transition-colors ${
                          report.program._id === selectedProgramReportId ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedProgramReportId(
                          report.program._id === selectedProgramReportId ? null : report.program._id!
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{report.program.title}</h4>
                            <Badge variant="outline">{report.program.programCode}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.program.startDate} to {report.program.endDate}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <span>👥 {report.statistics.uniqueAttendees} unique beneficiaries</span>
                            <span>📝 {report.statistics.totalEnrolledParticipants} enrolled</span>
                            <span>🎯 {report.statistics.completedSessions}/{report.statistics.totalSessions} sessions</span>
                            <span>✅ {report.statistics.overallAttendanceRate}% attendance</span>
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={(report.statistics.completedSessions / report.statistics.totalSessions) * 100}
                              className="h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Program Report */}
              {selectedProgramReport && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>📚 {selectedProgramReport.program.title} - Program Report</CardTitle>
                        <CardDescription>
                          Multi-session program with unique participant counting
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedProgramReportId(null)}>
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Key Metrics */}
                    <div>
                      <h4 className="font-medium mb-3">🎯 Key Program Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-800">
                              {selectedProgramReport.statistics.uniqueAttendees}
                            </div>
                            <div className="text-sm text-muted-foreground">Unique Beneficiaries</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-800">
                              {selectedProgramReport.statistics.totalEnrolledParticipants}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Enrolled</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-700">
                              {selectedProgramReport.statistics.completedParticipants}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {selectedProgramReport.statistics.overallAttendanceRate}%
                            </div>
                            <div className="text-sm text-muted-foreground">Attendance Rate</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {selectedProgramReport.statistics.retentionRate}%
                            </div>
                            <div className="text-sm text-muted-foreground">Retention Rate</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Session Progress */}
                    <div>
                      <h4 className="font-medium mb-3">📅 Session Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sessions Completed</span>
                          <span>{selectedProgramReport.statistics.completedSessions} / {selectedProgramReport.statistics.totalSessions}</span>
                        </div>
                        <Progress
                          value={(selectedProgramReport.statistics.completedSessions / selectedProgramReport.statistics.totalSessions) * 100}
                          className="h-3"
                        />
                      </div>
                    </div>

                    {/* Demographics */}
                    <div>
                      <h4 className="font-medium mb-3">👥 Participant Demographics</h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium mb-2">Age Groups</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedProgramReport.statistics.ageGroups).map(([ageGroup, count]) => (
                              <Card key={ageGroup} className="bg-gray-50">
                                <CardContent className="p-2 text-center">
                                  <div className="font-bold">{count}</div>
                                  <div className="text-xs text-muted-foreground">{ageGroup} years</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Gender Distribution</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(selectedProgramReport.statistics.genderDistribution).map(([gender, count]) => (
                              <Card key={gender} className="bg-gray-50">
                                <CardContent className="p-2 text-center">
                                  <div className="font-bold">{count}</div>
                                  <div className="text-xs text-muted-foreground capitalize">{gender}</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Material Distribution */}
                    {Object.keys(selectedProgramReport.materialDistribution).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">📦 Material Distribution Summary</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedProgramReport.materialDistribution).map(([productName, info]) => (
                            <Card key={productName} className="bg-gray-50">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{productName}</span>
                                  <div className="text-sm text-muted-foreground">
                                    {info.totalQuantity} units → {info.participantCount} participants → {info.sessionCount} sessions
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}