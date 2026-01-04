'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, DollarSign, Trash2, Plus, Image as ImageIcon, Loader2, Heart } from 'lucide-react';
import { supabase, WishlistItem } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface ViewWishlistProps {
  onClose: () => void;
  onAddToItinerary?: (place: WishlistItem) => void;
}

export default function ViewWishlist({ onClose, onAddToItinerary }: ViewWishlistProps) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      alert('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Remove this place from your wishlist?')) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      alert('Failed to remove item from wishlist');
    }
  };

  const getPriceLevel = (level?: number | null) => {
    if (!level) return 'N/A';
    return '¥'.repeat(level);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50" 
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        style={{ backgroundColor: '#D5D0C0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden p-6 text-white rounded-t-2xl" style={{ background: 'linear-gradient(to right, #E89CAE, #D8869C)' }}>
          <div className="absolute inset-0 opacity-5">
            <div style={{
              backgroundImage: `url('/assets/Kanagawa.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
            }} />
          </div>
  
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#D8869C' }}>
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  My Wishlist
                </h2>
                <p className="text-white opacity-90 text-sm mt-1">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'place' : 'places'} saved
                </p>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Wishlist Items */}
          <div className="w-1/2 flex flex-col" style={{ borderRight: '1px solid rgba(125, 116, 99, 0.3)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(125, 116, 99, 0.3)', backgroundColor: 'rgba(232, 156, 174, 0.1)' }}>
              <p className="text-sm" style={{ color: '#7D7463' }}>
                Click on any place to view details and add to your itinerary
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#E89CAE' }} />
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#7D7463' }}>
                  <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#E89CAE', opacity: 0.3 }} />
                  <p className="text-lg font-medium">No wishlist items yet</p>
                  <p className="text-sm mt-2">
                    Start adding places you want to visit!
                  </p>
                </div>
              ) : (
                wishlistItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full text-left rounded-lg border-2 p-4 hover:shadow-md transition-all"
                    style={{
                      backgroundColor: selectedItem?.id === item.id ? 'rgba(232, 156, 174, 0.1)' : '#D5D0C0',
                      borderColor: selectedItem?.id === item.id ? '#E89CAE' : 'rgba(125, 116, 99, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E89CAE'}
                    onMouseLeave={(e) => {
                      if (selectedItem?.id !== item.id) {
                        e.currentTarget.style.borderColor = 'rgba(125, 116, 99, 0.3)';
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.place_name}
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate" style={{ color: '#2c2416' }}>
                          {item.place_name}
                        </h3>
                        {item.address && (
                          <p className="text-sm truncate mt-1" style={{ color: '#7D7463' }}>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {item.address}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {item.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{item.rating}</span>
                            </div>
                          )}
                          {item.price_level && (
                            <div className="text-sm text-green-600 font-medium">
                              {getPriceLevel(item.price_level)}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-2 rounded-lg transition-colors shrink-0"
                        style={{ color: '#D64820' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(214, 72, 32, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Selected Item Details */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {selectedItem ? (
                <div>
                  {selectedItem.photo_url && (
                    <img
                      src={selectedItem.photo_url}
                      alt={selectedItem.place_name}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}

                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#2c2416' }}>
                    {selectedItem.place_name}
                  </h2>

                  {selectedItem.address && (
                    <p className="flex items-start gap-2 mb-4" style={{ color: '#7D7463' }}>
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      {selectedItem.address}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedItem.rating && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(232, 156, 174, 0.15)' }}>
                        <div className="flex items-center gap-2" style={{ color: '#2c2416' }}>
                          <Star className="w-5 h-5" />
                          <span className="font-bold text-lg">{selectedItem.rating}</span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: '#7D7463' }}>Rating</p>
                      </div>
                    )}      
                    {selectedItem.price_level && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 142, 111, 0.15)' }}>
                        <div className="flex items-center gap-2" style={{ color: '#2c2416' }}>
                          <DollarSign className="w-5 h-5" />
                          <span className="font-bold text-lg">
                            {getPriceLevel(selectedItem.price_level)}
                          </span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: '#7D7463' }}>Price range</p>
                      </div>
                    )}
                  </div>

                  {selectedItem.types && selectedItem.types.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-2" style={{ color: '#2c2416' }}>Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.types.slice(0, 5).map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: 'rgba(200, 184, 165, 0.3)', color: '#2c2416' }}
                          >
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {onAddToItinerary && (
                    <button
                      onClick={() => {
                        onAddToItinerary(selectedItem);
                        onClose();
                      }}
                      className="w-full text-white py-3 rounded-lg transition-all hover:shadow-lg font-medium flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(to right, #E89CAE, #D8869C)' }}
                    >
                      <Plus className="w-5 h-5" />
                      Add to Itinerary
                    </button>
                  )}

                  <p className="text-xs mt-4 text-center" style={{ color: '#7D7463' }}>
                    Added to wishlist on{' '}
                    {new Date(selectedItem.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: '#7D7463' }}>
                  <div className="text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#E89CAE', opacity: 0.3 }} />
                    <p className="text-lg font-medium">Select a place to view details</p>
                    <p className="text-sm mt-2">Click on any item from your wishlist</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}