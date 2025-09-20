'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Workshop, Participant } from '@/types/product'
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

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<WorkshopReport[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchReports()
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

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const selectedReport = reports.find(r => r.workshop._id === selectedReportId)

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">📊 Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into workshops, inventory, and system usage
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px solid #ddd', borderRadius: '8px' }}>
          No workshop reports available yet. Create some workshops to see reports here.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '300px 1fr' : '1fr', gap: '20px' }}>
          {/* Workshop List */}
          <div>
            <h3>Workshop Reports</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {reports.map((report) => (
                <div
                  key={report.workshop._id}
                  onClick={() => setSelectedReportId(report.workshop._id === selectedReportId ? null : report.workshop._id!)}
                  style={{
                    border: '1px solid #ccc',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: report.workshop._id === selectedReportId ? '#e0f2fe' : '#f9f9f9',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <h4 style={{ margin: '0 0 5px 0' }}>{report.workshop.title}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                    {report.workshop.date} | {report.workshop.location}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
                    <span>👥 {report.statistics.totalParticipants} participants</span>
                    <span>✅ {report.statistics.attendanceRate}% attendance</span>
                    <span>📦 {Object.keys(report.materialDistribution).length} materials</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Report View */}
          {selectedReport && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>📊 {selectedReport.workshop.title} - Detailed Report</h3>
                <button
                  onClick={() => setSelectedReportId(null)}
                  style={{ padding: '5px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>

              {/* Overview Statistics */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4>📈 Overview Statistics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>{selectedReport.statistics.totalParticipants}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total Participants</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>{selectedReport.statistics.attendedParticipants}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Attended</div>
                  </div>
                  <div style={{ background: '#fef7f0', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>{selectedReport.statistics.attendanceRate}%</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Attendance Rate</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{selectedReport.statistics.noShowParticipants}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>No Shows</div>
                  </div>
                </div>
              </div>

              {/* Age Demographics */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4>👥 Age Demographics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {Object.entries(selectedReport.statistics.ageGroups).map(([ageGroup, count]) => (
                    <div key={ageGroup} style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{count}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{ageGroup} years</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Status */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4>🏥 Special Status Participants</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#3730a3' }}>{selectedReport.statistics.specialStatus.disabled}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>🦽 Disabled</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#991b1b' }}>{selectedReport.statistics.specialStatus.wounded}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>🩹 Wounded</div>
                  </div>
                  <div style={{ background: '#fef7f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#9a3412' }}>{selectedReport.statistics.specialStatus.separated}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>💔 Separated</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#166534' }}>{selectedReport.statistics.specialStatus.unaccompanied}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>👤 Unaccompanied</div>
                  </div>
                </div>
              </div>

              {/* Material Distribution */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4>📦 Material Distribution</h4>
                {Object.keys(selectedReport.materialDistribution).length > 0 ? (
                  <div style={{ marginTop: '10px' }}>
                    {Object.entries(selectedReport.materialDistribution).map(([productName, info]) => (
                      <div key={productName} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>{productName}</span>
                        <span>{info.totalQuantity} units to {info.participantCount} participants</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '10px 0 0 0', color: '#666', fontStyle: 'italic' }}>No materials distributed yet</p>
                )}
              </div>

              {/* Participants List */}
              <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4>👥 Participants Details</h4>
                <div style={{ marginTop: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedReport.participants.map((participant) => (
                    <div key={participant._id} style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#f9f9f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h5 style={{ margin: '0 0 5px 0' }}>{participant.name}</h5>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                            Age: {participant.age} | Phone: {participant.phoneNumber}
                          </p>

                          {/* Special Status Tags */}
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px' }}>
                            {participant.specialStatus?.isDisabled && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>🦽</span>}
                            {participant.specialStatus?.isWounded && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>🩹</span>}
                            {participant.specialStatus?.isSeparated && <span style={{ background: '#fef7f0', color: '#9a3412', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>💔</span>}
                            {participant.specialStatus?.isUnaccompanied && <span style={{ background: '#f0fdf4', color: '#166534', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>👤</span>}
                          </div>

                          {/* Materials Received */}
                          {participant.materialsReceived && participant.materialsReceived.length > 0 && (
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ color: '#374151', fontWeight: 'bold' }}>Materials: </span>
                              {participant.materialsReceived.map((material, index) => (
                                <span key={index} style={{ marginRight: '8px', color: '#0369a1' }}>
                                  {material.productName} ({material.quantity})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: participant.attendanceStatus === 'attended' ? '#dcfce7' : participant.attendanceStatus === 'no-show' ? '#fee2e2' : '#fef3c7',
                          color: participant.attendanceStatus === 'attended' ? '#166534' : participant.attendanceStatus === 'no-show' ? '#dc2626' : '#92400e'
                        }}>
                          {participant.attendanceStatus === 'attended' ? '✅ Attended' :
                           participant.attendanceStatus === 'no-show' ? '❌ No Show' : '📝 Registered'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}