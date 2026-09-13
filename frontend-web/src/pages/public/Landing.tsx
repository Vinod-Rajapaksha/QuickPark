import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Shield, Zap, Clock, Smartphone, Headset, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const Landing: React.FC = () => {
  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-primary-500" />,
      title: "Find Spots Instantly",
      description: "Locate available parking spots near your destination in real-time."
    },
    {
      icon: <Zap className="w-6 h-6 text-primary-500" />,
      title: "Express Booking",
      description: "Reserve your spot in seconds with our lightning-fast booking system."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary-500" />,
      title: "Secure Payments",
      description: "Your transactions are encrypted and processed with bank-level security."
    },
    {
      icon: <Clock className="w-6 h-6 text-primary-500" />,
      title: "Flexible Extensions",
      description: "Need more time? Extend your parking session right from your phone."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-primary-500" />,
      title: "Digital Tickets",
      description: "Say goodbye to paper tickets. Your phone is all you need."
    },
    {
      icon: <Headset className="w-6 h-6 text-primary-500" />,
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to assist you."
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-100 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary-50 text-primary-600 font-semibold text-sm mb-6 border border-primary-100">
                <Rocket className="w-4 h-4" />
                The Future of Parking is Here
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 font-heading">
                Smart Parking, <br className="hidden md:block" />
                <span className="text-gradient">Zero Hassle.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Find, book, and manage your parking spaces with ease. QuickPark saves you time and eliminates the stress of urban parking.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/#how-it-works">
                  <Button variant="outline" size="lg">
                    See How it Works
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-3xl md:text-5xl font-bold mb-6 font-heading"
            >
              Everything you need for a <span className="text-primary-600">seamless experience</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              We've thought of everything to make your parking experience as smooth as possible.
            </motion.p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card interactive className="h-full border-slate-100 hover:border-primary-100">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-950"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
              Ready to park smarter?
            </h2>
            <p className="text-xl text-primary-200 mb-10">
              Join thousands of drivers who have already transformed their daily commute with QuickPark.
            </p>
            <Link to="/register">
              <Button variant="white" size="lg">
                Create Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
