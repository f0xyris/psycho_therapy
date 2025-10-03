import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LazyImage } from "./LazyImage";
import { useResizeOptimization } from "@/hooks/usePerformance";


interface StaffMember {
  id: number;
  name: string;
  position: string;
  specialization: string;
  image: string;
  experience: string;
  rating: number;
  achievements: string[];
}

// Оптимизированные изображения
const OPTIMIZED_STAFF_IMAGES = {
  anna: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=70",
  katarzyna: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=70",
  helena: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=70"
};

// Мемоизированный компонент для звездочек
const StarRating = ({ rating }: { rating: number }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
      />
    ));
  }, [rating]);

  return <div className="flex items-center justify-center space-x-1">{stars}</div>;
};

// Мемоизированный компонент для карточки сотрудника
const StaffCard = ({ member }: { member: StaffMember }) => {
  return (
    <div className="text-center h-full">
      <div className="bg-gradient-to-br from-white to-mystical-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300 border border-mystical-200 dark:border-mystical-700 h-full">
        <div className="flex flex-col items-center space-y-6 h-full">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-mystical-200 dark:ring-mystical-700 shadow-xl">
              <LazyImage
                src={member.image}
                alt={member.name}
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="text-center space-y-2 flex-grow flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-mystical-700 dark:text-mystical-300">{member.name}</h3>
            <p className="text-lg text-mystical-600 dark:text-mystical-400 font-medium">{member.position}</p>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">{member.specialization}</p>
          </div>

          <StarRating rating={member.rating} />
        </div>
      </div>
    </div>
  );
};

export const StaffSlider = () => {
  const { t } = useLanguage();
  
  const staffMembers: StaffMember[] = useMemo(() => [
    {
      id: 1,
      name: "Anna Kowalska",
      position: t.seniorMaster,
      specialization: t.laserEpilationSpec,
      image: OPTIMIZED_STAFF_IMAGES.anna,
      experience: `8 ${t.experienceYears}`,
      rating: 4.9,
      achievements: [t.certifiedSpecialistTitle, `2000+ ${t.clientsCount}`]
    },
    {
      id: 2,
      name: t.kseniaNovak,
      position: t.massageTherapist,
      specialization: t.classicSpaSpec,
      image: OPTIMIZED_STAFF_IMAGES.helena,
      experience: `6 ${t.experienceYears}`,
      rating: 4.8,
      achievements: [t.diplomaMassage, t.specialistYear]
    },
    {
      id: 3,
      name: "Katarzyna Lebedeva",
      position: t.cosmetologist,
      specialization: t.facialBodyCareSpec,
      image: OPTIMIZED_STAFF_IMAGES.katarzyna,
      experience: `5 ${t.experienceYears}`,
      rating: 4.9,
      achievements: [t.careExpert, t.internationalCert]
    },
    {
      id: 4,
      name: "Helena Vishnevska",
      position: t.trainingSpecialist,
      specialization: t.coursesWorkshopsSpec,
      image: OPTIMIZED_STAFF_IMAGES.helena,
      experience: `10 ${t.experienceYears}`,
      rating: 5.0,
      achievements: [t.topTrainer, `500+ ${t.graduatesCount}`]
    }
  ], [t]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

  // Мемоизируем обработчики
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % staffMembers.length);
  }, [staffMembers.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + staffMembers.length) % staffMembers.length);
  }, [staffMembers.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Мемоизируем видимых сотрудников
  const visibleMembers = useMemo(() => {
    const visible = [];
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % staffMembers.length;
      visible.push(staffMembers[index]);
    }
    return visible;
  }, [currentIndex, itemsToShow, staffMembers]);

  // Мемоизируем точки навигации
  const dotsIndicator = useMemo(() => {
    return staffMembers.map((_, index) => (
      <button
        key={index}
        onClick={() => handleDotClick(index)}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          currentIndex === index
            ? 'bg-mystical-600 dark:bg-mystical-400 scale-125 shadow-lg'
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-mystical-400 dark:hover:bg-mystical-500'
        }`}
      />
    ));
  }, [staffMembers.length, currentIndex, handleDotClick]);

  const handleResize = useCallback(() => {
    if (window.innerWidth < 640) {
      setItemsToShow(1);
    } else if (window.innerWidth < 1024) {
      setItemsToShow(2);
    } else {
      setItemsToShow(3);
    }
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    handleResize();
  }, [handleResize]);

  // Оптимизированный обработчик ресайза
  useResizeOptimization(handleResize);

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="py-20 bg-muted/50 dark:bg-deep-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-playfair font-bold text-mystical-600 dark:text-mystical-400 mb-4">
            {t.ourTeam}
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.ourTeamDescription}
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleMembers.map((member) => (
                <StaffCard key={member.id} member={member} />
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
          >
            <ChevronLeft className="h-6 w-6 text-mystical-600 dark:text-mystical-400 group-hover:text-mystical-700 dark:group-hover:text-mystical-300" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
          >
            <ChevronRight className="h-6 w-6 text-mystical-600 dark:text-mystical-400 group-hover:text-mystical-700 dark:group-hover:text-mystical-300" />
          </button>

          <div className="flex justify-center mt-8 space-x-3">
            {dotsIndicator}
          </div>
        </div>
      </div>
    </section>
  );
};