import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState, useEffect } from "react";

export const LocationMap = () => {
  const { t } = useLanguage();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const address = "Aleja Pułkownika Władysława Beliny-Prażmowskiego 20A, Kraków, Polska";
  const phoneNumber = "+48 12 123 45 67";
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.5!2d19.9449799!3d50.0646501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47165b0e5c7c7c7c%3A0x123456789abcdef0!2sAleja%20Pu%C5%82kownika%20W%C5%82adys%C5%82awa%20Beliny-Pra%C5%BCmowskiego%2020A%2C%2030-001%20Krak%C3%B3w%2C%20Polska!5e0!3m2!1spl!2spl!4v1672673890123!5m2!1spl!2spl`;

  const openInMaps = useMemo(() => () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  }, [address]);

  // Ленивая загрузка карты
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000); // Загружаем карту через 1 секунду после монтирования компонента

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 bg-background dark:bg-deep-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-mystical-600 dark:text-mystical-400 mb-4">
            {t.howToFindUs}
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.locationDescription}
          </p>
        </div>

        {/* Full Width Map */}
        <div className="relative">
          <Card className="border-mystical-200 dark:border-mystical-700">
            <CardContent className="p-0">
              <div className="relative h-48 md:h-[250px] lg:h-[300px] rounded-lg overflow-hidden">
                {isMapLoaded ? (
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400">Загрузка карты...</div>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Button
                    onClick={openInMaps}
                    className="bg-mystical-600 hover:bg-mystical-700 text-white shadow-lg"
                    size="sm"
                  >
                    <Navigation className="h-5 w-5 mr-2" style={{color: 'white', fill: 'white', stroke: 'white', strokeWidth: '2'}} />
                    {t.openInMaps}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};