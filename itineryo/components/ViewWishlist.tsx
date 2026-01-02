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
      className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-500 to-pink-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-7 h-7" />
                My Wishlist
              </h2>
              <p className="text-pink-100 text-sm mt-1">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'place' : 'places'} saved
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Wishlist Items */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Click on any place to view details and add to your itinerary
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600" />
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                    className={`w-full text-left bg-white border-2 rounded-lg p-4 hover:border-fuchsia-500 hover:shadow-md transition-all ${
                      selectedItem?.id === item.id ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-200'
                    }`}
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
                        <h3 className="font-bold text-gray-900 truncate">
                          {item.place_name}
                        </h3>
                        {item.address && (
                          <p className="text-sm text-gray-600 truncate mt-1">
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
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
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

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedItem.place_name}
                  </h2>

                  {selectedItem.address && (
                    <p className="text-gray-600 flex items-start gap-2 mb-4">
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      {selectedItem.address}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedItem.rating && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-900">
                          <Star className="w-5 h-5" />
                          <span className="font-bold text-lg">{selectedItem.rating}</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Rating</p>
                      </div>
                    )}

                    {selectedItem.price_level && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-green-900">
                          <DollarSign className="w-5 h-5" />
                          <span className="font-bold text-lg">
                            {getPriceLevel(selectedItem.price_level)}
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Price range</p>
                      </div>
                    )}
                  </div>

                  {selectedItem.types && selectedItem.types.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.types.slice(0, 5).map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
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
                      className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white py-3 rounded-lg hover:from-fuchsia-600 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add to Itinerary
                    </button>
                  )}

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Added to wishlist on{' '}
                    {new Date(selectedItem.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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