'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X, AlertTriangle, Info, AlertCircle, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Notification, NotificationPreferences } from '@/types/notifications'

interface NotificationSystemProps {
  userId: string
  userRole: string
}

export function NotificationSystem({ userId, userRole }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchPreferences()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length
    setUnreadCount(unread)
  }, [notifications])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        )
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        toast.success('Preferences updated')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return <AlertTriangle className="h-4 w-4 text-red-500" />

    switch (type) {
      case 'low_stock': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'workshop_reminder': return <Clock className="h-4 w-4 text-blue-500" />
      case 'system_alert': return <Info className="h-4 w-4 text-yellow-500" />
      case 'admin_alert': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'location_request': return <MapPin className="h-4 w-4 text-green-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread': return !notification.isRead
      case 'high': return notification.priority === 'high' || notification.priority === 'urgent'
      case 'low_stock': return notification.type === 'low_stock'
      case 'workshops': return notification.type === 'workshop_reminder'
      case 'location_requests': return notification.type === 'location_request'
      default: return true
    }
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage your notifications and preferences
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
              <TabsTrigger value="low_stock">Stock</TabsTrigger>
              <TabsTrigger value="workshops">Workshops</TabsTrigger>
              {userRole === 'admin' && (
                <TabsTrigger value="location_requests">
                  📍 Requests {(() => {
                    const locationRequests = notifications.filter(n => n.type === 'location_request' && !n.isRead).length;
                    return locationRequests > 0 ? `(${locationRequests})` : '';
                  })()}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-96">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications to show
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification._id}
                        className={`cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getNotificationIcon(notification.type, notification.priority)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">
                                    {notification.title}
                                  </h4>
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification._id!)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteNotification(notification._id!)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <Separator />

          <NotificationPreferencesSection
            preferences={preferences}
            onUpdate={updatePreferences}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

interface NotificationPreferencesSectionProps {
  preferences: NotificationPreferences | null
  onUpdate: (preferences: Partial<NotificationPreferences>) => void
  loading: boolean
}

function NotificationPreferencesSection({
  preferences,
  onUpdate,
  loading
}: NotificationPreferencesSectionProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences)

  useEffect(() => {
    setLocalPrefs(preferences)
  }, [preferences])

  if (!localPrefs) return null

  const handleUpdate = (section: string, key: string, value: any) => {
    const updated = {
      ...localPrefs,
      [section]: {
        ...localPrefs[section as keyof NotificationPreferences],
        [key]: value
      }
    } as NotificationPreferences

    setLocalPrefs(updated)
    onUpdate(updated)
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Notification Preferences</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Email Notifications</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-low-stock" className="text-sm">Low Stock Alerts</Label>
              <Switch
                id="email-low-stock"
                checked={localPrefs.emailNotifications.lowStock}
                onCheckedChange={(checked) =>
                  handleUpdate('emailNotifications', 'lowStock', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-workshops" className="text-sm">Workshop Reminders</Label>
              <Switch
                id="email-workshops"
                checked={localPrefs.emailNotifications.workshopReminders}
                onCheckedChange={(checked) =>
                  handleUpdate('emailNotifications', 'workshopReminders', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-system" className="text-sm">System Alerts</Label>
              <Switch
                id="email-system"
                checked={localPrefs.emailNotifications.systemAlerts}
                onCheckedChange={(checked) =>
                  handleUpdate('emailNotifications', 'systemAlerts', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-location-requests" className="text-sm">Location Requests</Label>
              <Switch
                id="email-location-requests"
                checked={localPrefs.emailNotifications.locationRequests}
                onCheckedChange={(checked) =>
                  handleUpdate('emailNotifications', 'locationRequests', checked)
                }
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">In-App Notifications</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-low-stock" className="text-sm">Low Stock Alerts</Label>
              <Switch
                id="push-low-stock"
                checked={localPrefs.pushNotifications.lowStock}
                onCheckedChange={(checked) =>
                  handleUpdate('pushNotifications', 'lowStock', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-workshops" className="text-sm">Workshop Reminders</Label>
              <Switch
                id="push-workshops"
                checked={localPrefs.pushNotifications.workshopReminders}
                onCheckedChange={(checked) =>
                  handleUpdate('pushNotifications', 'workshopReminders', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-system" className="text-sm">System Alerts</Label>
              <Switch
                id="push-system"
                checked={localPrefs.pushNotifications.systemAlerts}
                onCheckedChange={(checked) =>
                  handleUpdate('pushNotifications', 'systemAlerts', checked)
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-location-requests" className="text-sm">Location Requests</Label>
              <Switch
                id="push-location-requests"
                checked={localPrefs.pushNotifications.locationRequests}
                onCheckedChange={(checked) =>
                  handleUpdate('pushNotifications', 'locationRequests', checked)
                }
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="low-stock-threshold" className="text-sm font-medium">
            Low Stock Threshold
          </Label>
          <NumberInput
            id="low-stock-threshold"
            min={1}
            value={localPrefs.lowStockThreshold}
            onChange={(value) =>
              setLocalPrefs(prev => prev ? {
                ...prev,
                lowStockThreshold: value || 5
              } : null)
            }
            onBlur={() => onUpdate({ lowStockThreshold: localPrefs.lowStockThreshold })}
            disabled={loading}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}