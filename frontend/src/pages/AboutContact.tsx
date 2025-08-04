import React, { useState } from 'react';
import { Users, Target, Globe, Github, Linkedin, Twitter, Award, Briefcase, Code, Coffee, Database, Server, Cloud, Brain, Link2, MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import devansh from "../../assets/devansh.jpg";
import hitesh from "../../assets/hitesh.jpg";
import om1 from "../../assets/om1.jpeg";
import Rohit from "../../assets/Rohit.jpeg";

// Types
interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactInfo {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

interface SocialLink {
  icon: React.ReactNode;
  bg: string;
  url: string;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  expertise: string[];
  achievements: string[];
  social: {
    linkedin: string;
    twitter: string;
    github: string;
  };
}

export default function AboutContactPage() {
  // State
  const [activeTab, setActiveTab] = useState('about');
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [formState, setFormState] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Constants
  const stats = [
    { number: "50K+", label: "Active Users", icon: <Users className="h-6 w-6" /> },
    { number: "24/7", label: "Market Coverage", icon: <Globe className="h-6 w-6" /> },
    { number: "99.9%", label: "Uptime", icon: <Server className="h-6 w-6" /> },
    { number: "500M+", label: "Daily Transactions", icon: <Database className="h-6 w-6" /> }
  ];

  const achievements = [
    { year: "2023", title: "Forbes Fintech 50", description: "Recognized as one of the most innovative fintech companies" },
    { year: "2022", title: "Best Trading Platform", description: "Awarded by International Trading Awards" },
    { year: "2021", title: "Series B Funding", description: "$150M raised to expand global operations" },
    { year: "2020", title: "Company Launch", description: "Successfully launched with 10,000 beta users" }
  ];

  const team: TeamMember[] = [
    {
      name: "Hitesh Prakash Pawar",
      role: "CEO & founder",
      image: hitesh,
      bio: "Information technology student specializing in system architecture and algorithmic trading. Building scalable solutions and leading the technical development of the platform.",
      expertise: ["System Architecture", "High-Frequency Trading", "Cloud Infrastructure"],
      achievements: ["Patent Holder", "Tech Innovation Award"],
      social: {
        linkedin: "https://www.linkedin.com/in/hiteshpawar2804/",
        twitter: "#",
        github: "https://github.com/hiteshp28"
      }
    }
  ];

  const technologies = [
    { name: "Real-time Processing", icon: <Code className="h-6 w-6" />, description: "Sub-millisecond trade execution" },
    { name: "AI Trading Algorithms", icon: <Brain className="h-6 w-6" />, description: "Advanced predictive analytics" },
    { name: "Cloud Infrastructure", icon: <Cloud className="h-6 w-6" />, description: "Global distributed systems" },
    { name: "Blockchain Integration", icon: <Link2 className="h-6 w-6" />, description: "Secure transaction ledger" }
  ];

  const contactInfo: ContactInfo[] = [
    { 
      icon: <MapPin className="h-5 w-5 text-blue-600" />, 
      label: "Our Location", 
      value: "Pune Institute of Computer Technology" 
    },
    { 
      icon: <Phone className="h-5 w-5 text-blue-600" />, 
      label: "Phone Number", 
      value: "9209415157" 
    },
    { 
      icon: <Mail className="h-5 w-5 text-blue-600" />, 
      label: "Email Address", 
      value: "growup@gmail.com" 
    },
    {
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      label: "Business Hours",
      value: (
        <>
          <p>Mon - Fri: 9am - 3:30pm</p>
          <p>Sat - Sun: Closed</p>
        </>
      )
    },
  ];

  const socialLinks: SocialLink[] = [
    { 
      icon: <Facebook className="h-5 w-5" />, 
      bg: "bg-blue-500", 
      url: "https://facebook.com" 
    },
    { 
      icon: <Twitter className="h-5 w-5" />, 
      bg: "bg-sky-500", 
      url: "https://twitter.com" 
    },
    { 
      icon: <Instagram className="h-5 w-5" />, 
      bg: "bg-pink-600", 
      url: "https://instagram.com" 
    },
    { 
      icon: <Linkedin className="h-5 w-5" />, 
      bg: "bg-blue-700", 
      url: "https://linkedin.com" 
    },
  ];

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const res = await fetch(`${import.meta.env.VITE_FLASK_BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formState),
      });
  
      const data = await res.json();
  
      if (data.success) {
        setIsSubmitted(true);
        setFormState({ name: "", email: "", subject: "", message: "" });
        toast.success("Message sent successfully!");
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-2 rounded-full ${
                activeTab === 'about'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-2 rounded-full ${
                activeTab === 'contact'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'about' ? (
        <>
          {/* Hero Section */}
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  About GrowUp
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                  Empowering investors with cutting-edge technology and real-time market insights.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 ${
                    hoveredStat === index ? 'scale-105 shadow-lg' : ''
                  }`}
                  onMouseEnter={() => setHoveredStat(index)}
                  onMouseLeave={() => setHoveredStat(null)}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      hoveredStat === index ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-500'
                    }`}>
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-center text-gray-900">{stat.number}</h3>
                  <p className="text-sm text-center text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Cards */}
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white rounded-xl shadow-md p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Our Mission</h3>
                <p className="mt-4 text-gray-600">
                  To democratize stock trading by providing professional-grade tools and insights to investors of all levels.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-green-500 to-green-600 text-white mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Global Reach</h3>
                <p className="mt-4 text-gray-600">
                  Connected to major exchanges worldwide, offering diverse investment opportunities across global markets.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 text-white mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Our Team</h3>
                <p className="mt-4 text-gray-600">
                  A dedicated team of financial experts, developers, and customer support professionals working to ensure your success.
                </p>
              </div>
            </div>
          </div>

          {/* Technologies Section */}
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-white shadow-sm rounded-xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Technology Stack</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {technologies.map((tech, index) => (
                <div key={index} className="p-6 rounded-lg border-2 border-gray-100 hover:border-blue-500 transition-colors duration-300">
                  <div className="flex items-center justify-center mb-4 text-blue-500">
                    {tech.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">{tech.name}</h3>
                  <p className="text-sm text-center text-gray-600">{tech.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
                  <div className="relative h-56 flex items-center justify-center bg-gray-50">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-48 h-48 object-cover rounded-full"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-blue-600 mb-2">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.expertise.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Achievements</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.achievements.map((achievement, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <a href={member.social.linkedin} className="text-gray-600 hover:text-blue-600" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a href={member.social.twitter} className="text-gray-600 hover:text-blue-400" target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-5 w-5" />
                      </a>
                      <a href={member.social.github} className="text-gray-600 hover:text-gray-900" target="_blank" rel="noopener noreferrer">
                        <Github className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Fill out the form below or use our contact info.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="border rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>

                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-100 text-green-800 p-4 rounded-md mb-6"
                  >
                    Thank you for your message! We'll get back to you soon.
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      placeholder="How can we help you?"
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      required
                      placeholder="Your message here..."
                      rows={5}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-8"
            >
              <div className="border rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  {contactInfo.map(({ icon, label, value }, idx) => (
                    <div className="flex items-start" key={idx}>
                      <div className="bg-blue-100 p-3 rounded-full mr-4">{icon}</div>
                      <div>
                        <h3 className="font-medium">{label}</h3>
                        <div className="text-gray-600">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
                <p className="text-gray-600 mb-6">
                  Follow us on social media to stay updated with our latest news and announcements.
                </p>
                <div className="flex gap-4">
                  {socialLinks.map(({ icon, bg, url }, idx) => (
                    <motion.a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`${bg} p-3 rounded-full text-white hover:opacity-90 transition-opacity`}
                    >
                      {icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
} 