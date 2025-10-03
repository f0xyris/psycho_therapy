import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { ImageSlider } from "@/components/ImageSlider";
// import { StaffSlider } from "@/components/StaffSlider";
// import { LocationMap } from "@/components/LocationMap";
// import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";

// Ленивая загрузка тяжелых компонентов (отключено)
// const LazyStaffSlider = lazy(() => import("@/components/StaffSlider").then(module => ({ default: module.StaffSlider })));
// const LazyLocationMap = lazy(() => import("@/components/LocationMap").then(module => ({ default: module.LocationMap })));

// Изображения для слайдера
const HERO_IMAGES = {
  hero1: "/images/hero1.jpg",
  hero2: "/images/hero2.jpg",
  hero3: "/images/hero3.jpg",
  hero4: "/images/hero4.jpg",
  hero5: "/images/hero5.jpg",
  features: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&h=800&q=70"
};

// Фото терапевта (временное изображение, можно заменить на реальное)
const THERAPIST_PHOTO = "images/me.jpg";

// Компонент для сервисов
const ServicesSection = ({ t }: { t: any }) => {
  const services = useMemo(() => [
    {
      title: t.laserHairRemoval,
      description: t.laserHairRemovalDesc,
      price: "60"
    },
    {
      title: t.massage,
      description: t.massageDesc,
      price: "120"
    },
    {
      title: t.groupTherapy,
      description: t.groupTherapyDesc,
      price: "180"
    },
    {
      title: t.childTherapy,
      description: t.childTherapyDesc,
      price: "50"
    }
  ], [t]);

  return (
    <section className="pb-20 bg-white dark:bg-deep-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-playfair font-bold text-mystical-600 dark:text-mystical-400 mb-4">
            {t.servicesTitle}
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.servicesDescription}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <Card key={index} className="bg-background dark:bg-card hover:shadow-xl dark:hover:shadow-mystical-500/20 transition-all duration-300 border-mystical-200 dark:border-mystical-700 group h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-playfair font-semibold text-mystical-600 dark:text-mystical-400 mb-3">{service.title}</h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {service.description}
                </p>
                <div className="mt-auto pt-4 text-accent-600 dark:text-accent-400 font-semibold">{t.duration}: {service.price} {t.minutes}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Компонент для преимуществ
const FeaturesSection = ({ t }: { t: any }) => {
  const features = useMemo(() => [
    {
      title: t.modernEquipment,
      description: t.modernEquipmentDesc
    },
    {
      title: t.experiencedSpecialists,
      description: t.experiencedSpecialistsDesc
    },
    {
      title: t.individualApproach,
      description: t.individualApproachDesc
    }
  ], [t]);

  return (
    <section className="pb-20 bg-white dark:bg-deep-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src={HERO_IMAGES.features}
              alt="Therapy room"
              className="w-full h-auto rounded-xl shadow-xl object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-playfair font-bold text-mystical-600 dark:text-mystical-400">
              {t.whyChooseUs}
            </h2>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <CheckCircle className="text-mystical-600 dark:text-mystical-400 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-playfair font-semibold text-mystical-600 dark:text-mystical-300">{feature.title}</h3>
                    <p className="text-muted-foreground dark:text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Блок "Про терапевта"
const AboutTherapistSection = ({ t }: { t: any }) => {
  return (
    <section className="py-20 bg-white dark:bg-deep-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <img
              src={THERAPIST_PHOTO}
              alt="Therapist portrait"
              className="w-full h-auto max-h-[520px] md:max-h-[560px] object-cover rounded-xl shadow-xl"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-playfair font-bold text-mystical-600 dark:text-mystical-400">
              {t.aboutTitle}
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground text-lg">
              {t.aboutDescription}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-mystical-50 dark:bg-deep-800 text-mystical-700 dark:text-mystical-200">
                <div className="text-sm font-semibold">{t.certifiedSpecialistTitle}</div>
              </div>
              <div className="p-4 rounded-lg bg-mystical-50 dark:bg-deep-800 text-mystical-700 dark:text-mystical-200">
                <div className="text-sm font-semibold">{t.experiencedSpecialists}</div>
              </div>
              <div className="p-4 rounded-lg bg-mystical-50 dark:bg-deep-800 text-mystical-700 dark:text-mystical-200">
                <div className="text-sm font-semibold">{t.individualApproach}</div>
              </div>
            </div>
            <div>
              <Link href="/booking">
                <Button className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white px-6 sm:px-8 py-3 font-semibold">
                  {t.bookAppointment ?? t.bookNow}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};



const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();
  
  const heroSlides = useMemo(() => [
    {
      image: HERO_IMAGES.hero1,
      title: "Анна Кухарська — психолог, психотерапевт",
      subtitle: "Там, де є тривога й страх — може народитися опора та право жити своє життя.",
      description: ""
    },
    {
      image: HERO_IMAGES.hero2,
      title: "Індивідуальна терапія",
      subtitle: "",
      description: "Безпечний простір для дослідження себе. Робота з тривогою, панічними атаками, дитячими травмами, вигоранням."
    },
    {
      image: HERO_IMAGES.hero3,
      title: "Парна терапія",
      subtitle: "",
      description: "Для тих, кому важко чути одне одного. Допомагаю парам знаходити довіру, близькість і нові способи спілкування."
    },
    {
      image: HERO_IMAGES.hero4,
      title: "Групова терапія",
      subtitle: "",
      description: "Можливість проживати досвід разом. Група — це підтримка, віддзеркалення та сила відчуття «я не один/одна»."
    },
    {
      image: HERO_IMAGES.hero5,
      title: "Дитяча терапія (від 8 років)",
      subtitle: "",
      description: "Працюю з дітьми та підлітками, які шукають себе, переживають тривогу чи труднощі в школі та стосунках."
    }
  ], []);

  const currentSlideData = heroSlides[currentSlide];

  return (
    <main className="relative">
      {/* Hero Slider Section */}
      <section className="relative h-[calc(100vh-64px)] min-h-[500px]">
        {/* Background Images Slider */}
        <div className="absolute inset-0 z-0">
          <ImageSlider 
            slides={heroSlides} 
            interval={6000} 
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 h-full w-full bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex flex-col justify-center items-center h-full py-8">
              {/* Text content */}
              <div className="mb-8 min-h-[200px] sm:min-h-[280px] flex flex-col justify-center">
                <h1 className="text-2xl sm:text-4xl lg:text-6xl font-playfair font-bold text-white leading-tight drop-shadow-2xl mb-4 sm:mb-6 px-4">
                  {currentSlideData.title}
                </h1>
                <p className="text-base sm:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto drop-shadow-lg mb-3 sm:mb-4 px-4">
                  {currentSlideData.subtitle}
                </p>
                <p className="text-sm sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto drop-shadow-lg px-4">
                  {currentSlideData.description}
                </p>
              </div>
              
              {/* Button */}
              <div className="flex justify-center pointer-events-auto px-4">
                <Link href="/booking">
                  <Button className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white px-6 sm:px-8 py-3 font-semibold w-full sm:w-auto">
                    {t.bookNow}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Therapist Section */}
      <AboutTherapistSection t={t} />

      {/* Services Section */}
      <ServicesSection t={t} />

      {/* Features Section */}
      <FeaturesSection t={t} />

      {/* Staff Slider Section removed */}
      {/* Location Map Section removed */}
    </main>
  );
};

export default Home;
