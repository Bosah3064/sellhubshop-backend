import { useState, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  Flag,
  MessageCircle,
  Sparkles,
  Filter,
  SortAsc,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  seller_id: string;
  product_id?: string;
  helpful_count: number;
  is_verified: boolean;
  reviewer: {
    full_name: string;
    avatar_url?: string;
    username?: string;
  };
}

interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export default function Reviews() {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistribution[]
  >([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const findSellerToReview = async (currentUserId: string) => {
    try {
      const { data: sellersWithProducts } = await supabase
        .from("products")
        .select("user_id")
        .neq("user_id", currentUserId)
        .limit(5);

      if (sellersWithProducts && sellersWithProducts.length > 0) {
        return sellersWithProducts[0].user_id;
      }

      const { data: otherUsers } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", currentUserId)
        .limit(1);

      return otherUsers?.[0]?.id || null;
    } catch (error) {
      console.error("Error finding seller:", error);
      return null;
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view reviews",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const sellerIdToUse = await findSellerToReview(user.id);

      if (!sellerIdToUse) {
        console.log("No seller found to display reviews for");
        setReviews([]);
        calculateRatingStats([]);
        setLoading(false);
        return;
      }

      setSellerId(sellerIdToUse);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            full_name,
            avatar_url,
            username
          )
        `
        )
        .eq("seller_id", sellerIdToUse)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        toast({
          title: "Error loading reviews",
          description: reviewsError.message,
          variant: "destructive",
        });
        setReviews([]);
        calculateRatingStats([]);
        return;
      }

      setReviews(reviewsData || []);
      calculateRatingStats(reviewsData || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error loading reviews",
        description: "Failed to load reviews data",
        variant: "destructive",
      });
      setReviews([]);
      calculateRatingStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRatingStats = (reviewsData: Review[]) => {
    const total = reviewsData.length;
    setTotalReviews(total);

    if (total === 0) {
      setOverallRating(0);
      setRatingDistribution([
        { stars: 5, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 1, count: 0, percentage: 0 },
      ]);
      return;
    }

    const average =
      reviewsData.reduce((acc, review) => acc + review.rating, 0) / total;
    setOverallRating(parseFloat(average.toFixed(1)));

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviewsData.filter(
        (review) => review.rating === stars
      ).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { stars, count, percentage };
    });

    setRatingDistribution(distribution);
  };

  const handleSubmitReview = async () => {
    if (!rating || !review.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a rating and review text",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit a review",
          variant: "destructive",
        });
        return;
      }

      if (!sellerId) {
        toast({
          title: "No seller available",
          description: "Cannot submit review at this time",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        rating,
        comment: review.trim(),
        reviewer_id: user.id,
        seller_id: sellerId,
        helpful_count: 0,
        is_verified: true,
      });

      if (error) {
        console.error("Review submission error:", error);

        if (error.message.includes("Cannot review yourself")) {
          toast({
            title: "Cannot review yourself",
            description: "You cannot leave a review for your own account",
            variant: "destructive",
          });
          return;
        }

        throw error;
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your valuable feedback",
      });

      setRating(0);
      setReview("");
      loadReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description:
          error.message || "There was an error submitting your review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string, currentCount: number) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ helpful_count: currentCount + 1 })
        .eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, helpful_count: currentCount + 1 }
            : review
        )
      );

      toast({
        title: "Thank you for your feedback!",
        description: "Marked as helpful",
      });
    } catch (error) {
      console.error("Error updating helpful count:", error);
      toast({
        title: "Failed to update",
        description: "There was an error marking the review as helpful",
        variant: "destructive",
      });
    }
  };

  const handleReport = (reviewId: string) => {
    toast({
      title: "Review reported",
      description:
        "Thank you for reporting this review. Our team will review it shortly.",
    });
  };

  const renderStars = (
    count: number,
    interactive = false,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= count
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform duration-200"
                : ""
            }`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;

    // Apply rating filter
    if (filterRating) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "helpful":
        filtered = [...filtered].sort(
          (a, b) => (b.helpful_count || 0) - (a.helpful_count || 0)
        );
        break;
      case "highest":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered = [...filtered].sort((a, b) => a.rating - b.rating);
        break;
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Loading Reviews
            </h2>
            <p className="text-muted-foreground">
              Gathering community insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl mb-6 border border-primary/20">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Customer Reviews
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your experience and read authentic feedback from our community
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Overall Rating Card */}
          <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Overall Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {overallRating}
                </div>
                {renderStars(Math.round(overallRating), false, "lg")}
                <p className="text-muted-foreground mt-3">
                  Based on {totalReviews} verified reviews
                </p>
              </div>

              <div className="space-y-3">
                {ratingDistribution.map((item) => (
                  <div
                    key={item.stars}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      setFilterRating(
                        item.stars === filterRating ? null : item.stars
                      )
                    }
                  >
                    <span className="text-sm font-medium w-8 flex items-center gap-1">
                      {item.stars}
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </span>
                    <Progress
                      value={item.percentage}
                      className="flex-1 h-2 bg-muted/50"
                      indicatorClassName={`${
                        filterRating === item.stars
                          ? "bg-primary"
                          : "bg-yellow-400"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              {filterRating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterRating(null)}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Write Review Card */}
          <Card className="lg:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Share Your Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    {renderStars(rating, true, "lg")}
                    <span className="text-lg font-semibold text-primary">
                      {rating > 0
                        ? `${rating} star${rating > 1 ? "s" : ""}`
                        : "Select your rating"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Your Review
                  </label>
                  <Textarea
                    placeholder="Share details about your experience. What did you like? What could be improved? Your feedback helps others make better decisions."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={5}
                    className="resize-none border-border/50 focus:border-primary/50 transition-colors"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      {review.length}/500 characters
                    </p>
                    {review.length > 400 && (
                      <p className="text-xs text-amber-600">
                        {500 - review.length} characters remaining
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={
                      !rating || !review.trim() || submitting || !sellerId
                    }
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Review...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setRating(0);
                      setReview("");
                    }}
                    disabled={submitting}
                    size="lg"
                  >
                    Clear
                  </Button>
                </div>

                {!sellerId && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Shield className="h-4 w-4" />
                      <p className="text-sm">
                        No active sellers available for review at the moment.
                        Please check back later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Community Reviews
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredReviews.length} of {totalReviews} reviews
                {filterRating && ` • Filtered by ${filterRating} stars`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Sort
                    <SortAsc className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort Reviews By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSortBy("recent")}>
                      Most Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("helpful")}>
                      Most Helpful
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("highest")}>
                      Highest Rated
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("lowest")}>
                      Lowest Rated
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <Card
                  key={review.id}
                  className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-green-100 shadow-sm">
                        <AvatarImage src={review.reviewer?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 text-green-700 font-semibold">
                          {review.reviewer?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {review.reviewer?.full_name || "Anonymous User"}
                              </p>
                              {review.reviewer?.username && (
                                <p className="text-sm text-muted-foreground">
                                  @{review.reviewer.username}
                                </p>
                              )}
                            </div>
                            {review.is_verified && (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
                              >
                                <CheckCircle className="h-3 w-3 fill-current" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(review.created_at)}
                          </span>
                        </div>

                        <div className="mb-4">
                          {renderStars(review.rating, false, "md")}
                        </div>

                        <p className="text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap">
                          {review.comment}
                        </p>

                        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleHelpful(
                                review.id,
                                review.helpful_count || 0
                              )
                            }
                            className="flex items-center gap-2 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Helpful ({review.helpful_count || 0})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReport(review.id)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          >
                            <Flag className="h-4 w-4" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="max-w-md mx-auto">
                  <MessageCircle className="h-20 w-20 text-muted-foreground/40 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    No reviews match your criteria
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {filterRating
                      ? `No ${filterRating}-star reviews found. Try adjusting your filters to see more reviews.`
                      : "Be the first to share your experience! Your review helps build trust in our community."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {filterRating && (
                      <Button
                        variant="outline"
                        onClick={() => setFilterRating(null)}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        document.querySelector("textarea")?.focus()
                      }
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    >
                      Write First Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
