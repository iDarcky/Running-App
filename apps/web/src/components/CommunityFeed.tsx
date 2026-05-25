import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input } from './UIComponents';
import { Heart, MessageCircle, Footprints, Bike, Mountain, Waves, UserPlus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'run': return <Footprints className="w-5 h-5" />;
    case 'bike': return <Bike className="w-5 h-5" />;
    case 'hike': return <Mountain className="w-5 h-5" />;
    case 'swim': return <Waves className="w-5 h-5" />;
    default: return <Footprints className="w-5 h-5" />;
  }
};

export const CommunityFeed: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    setCurrentUserId(userId || null);

    // Fetch public activities + profiles + likes + comments
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profile:profiles(*),
        likes(user_id),
        comments(id, content, user_id, profiles(full_name))
      `)
      .eq('visibility', 'public')
      .order('start_time', { ascending: false })
      .limit(20);

    if (error) console.error(error);

    if (data) {
      const enrichedData = data.map(act => ({
        ...act,
        user_has_liked: userId ? act.likes.some((l: any) => l.user_id === userId) : false,
        likes_count: act.likes.length,
      }));
      setActivities(enrichedData);
    }

    if (userId && data) {
       // Check follows
       const userIdsInFeed = [...new Set(data.map(a => a.user_id))];
       const { data: followsData } = await supabase
         .from('follows')
         .select('following_id')
         .eq('follower_id', userId)
         .in('following_id', userIdsInFeed);

       if (followsData) {
         const fMap: Record<string, boolean> = {};
         followsData.forEach(f => { fMap[f.following_id] = true; });
         setFollowingMap(fMap);
       }
    }

    setLoading(false);
  };

  const toggleLike = async (activityId: string, currentlyLiked: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setActivities(acts => acts.map(a => {
        if (a.id === activityId) {
            return {
                ...a,
                user_has_liked: !currentlyLiked,
                likes_count: currentlyLiked ? a.likes_count - 1 : a.likes_count + 1
            };
        }
        return a;
    }));

    if (currentlyLiked) {
        await supabase.from('likes').delete().match({ user_id: currentUserId, activity_id: activityId });
    } else {
        await supabase.from('likes').insert({ user_id: currentUserId, activity_id: activityId });
    }
  };

  const handleFollow = async (userIdToFollow: string) => {
    if (!currentUserId || currentUserId === userIdToFollow) return;

    const currentlyFollowing = followingMap[userIdToFollow];

    setFollowingMap(prev => ({...prev, [userIdToFollow]: !currentlyFollowing}));

    if (currentlyFollowing) {
        await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: userIdToFollow });
    } else {
        await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userIdToFollow });
    }
  };

  const formatPace = (movingTimeSec: number, distanceKm: number) => {
    if (!distanceKm || !movingTimeSec) return '0:00/km';
    const totalMinutes = movingTimeSec / 60;
    const paceMinutesDecimal = totalMinutes / distanceKm;
    const paceMins = Math.floor(paceMinutesDecimal);
    const paceSecs = Math.round((paceMinutesDecimal - paceMins) * 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}/km`;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading feed...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <h2 className="text-2xl font-bold mb-6">Community Feed</h2>

      {activities.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500 border border-gray-200">
          No activities found yet. Be the first to share!
        </div>
      ) : (
        activities.map(activity => (
          <Card key={activity.id} className="p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EE0000] text-white rounded-full flex items-center justify-center font-bold">
                  {activity.profile?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{activity.profile?.full_name || 'Unknown User'}</h3>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.start_time), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {currentUserId && currentUserId !== activity.user_id && (
                  <button
                    onClick={() => handleFollow(activity.user_id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${followingMap[activity.user_id] ? 'bg-gray-100 text-gray-600 border-gray-200' : 'text-[#EE0000] border-[#EE0000] hover:bg-red-50'}`}
                  >
                      {followingMap[activity.user_id] ? <><Check className="w-3 h-3"/> Following</> : <><UserPlus className="w-3 h-3"/> Follow</>}
                  </button>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                 <div className="p-1.5 bg-red-50 text-[#EE0000] rounded-md">
                     <ActivityIcon type={activity.activity_type} />
                 </div>
                 <h4 className="font-bold text-lg">{activity.title}</h4>
              </div>

              {activity.description && (
                <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
                  <p className="font-mono font-medium text-lg">{activity.distance_km.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{activity.activity_type === 'bike' ? 'Speed' : 'Pace'}</p>
                  <p className="font-mono font-medium text-lg">
                      {activity.activity_type === 'bike'
                        ? `${((activity.distance_km / activity.moving_time) * 3600).toFixed(1)} km/h`
                        : formatPace(activity.moving_time, activity.distance_km)
                      }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Time</p>
                  <p className="font-mono font-medium text-lg">
                      {Math.floor(activity.moving_time / 60)}m {activity.moving_time % 60}s
                  </p>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-6 bg-white">
              <button
                onClick={() => toggleLike(activity.id, activity.user_has_liked)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${activity.user_has_liked ? 'text-[#EE0000]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`w-5 h-5 ${activity.user_has_liked ? 'fill-current' : ''}`} />
                {activity.likes_count}
              </button>

              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
                <MessageCircle className="w-5 h-5" />
                {activity.comments?.length || 0}
              </button>
            </div>

            {/* Comments Snippet */}
            {activity.comments && activity.comments.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm">
                    {activity.comments.slice(0, 2).map((c: any) => (
                        <div key={c.id} className="mb-1">
                            <span className="font-semibold text-gray-900 mr-2">{c.profiles?.full_name}:</span>
                            <span className="text-gray-600">{c.content}</span>
                        </div>
                    ))}
                    {activity.comments.length > 2 && (
                        <button className="text-xs text-gray-500 mt-1 hover:underline">View all comments</button>
                    )}
                </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};
