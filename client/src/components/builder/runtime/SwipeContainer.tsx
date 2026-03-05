import { useRef, type ReactNode } from "react";

interface SwipeContainerProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export default function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeContainerProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only count as swipe if horizontal movement > vertical (avoid scroll conflicts)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        onSwipeLeft(); // swiped left = go forward
      } else {
        onSwipeRight(); // swiped right = go back
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen"
    >
      {children}
    </div>
  );
}
