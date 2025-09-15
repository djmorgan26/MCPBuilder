import React from 'react';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

interface HeroSectionProps {
  onStartBuilding: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartBuilding }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent-neon/20 to-accent-purple/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-accent-silver/20 to-accent-neon/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23333333' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Professional MCP Server Studio
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-6 font-apple leading-tight">
            <span className="block">Build</span>
            <span className="block bg-gradient-to-r from-accent-silver via-accent-neon to-accent-purple bg-clip-text text-transparent">
              Extraordinary
            </span>
            <span className="block">MCP Servers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Create production-ready Model Context Protocol servers with our premium, 
            no-code visual builder. Experience the future of AI infrastructure.
          </p>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-neon to-accent-purple rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-dark-bg" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Lightning Fast</h3>
              <p className="text-sm text-text-tertiary text-center">
                Build and deploy in minutes, not hours
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-silver to-accent-neon rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-dark-bg" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Enterprise Ready</h3>
              <p className="text-sm text-text-tertiary text-center">
                Production-grade security and scalability
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-neon rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-dark-bg" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Visual Design</h3>
              <p className="text-sm text-text-tertiary text-center">
                Intuitive drag-and-drop interface
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={onStartBuilding}
              className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-neon"
            >
              <span>Start Building</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="group flex items-center space-x-3 px-8 py-4 border-2 border-accent-silver text-accent-silver hover:bg-accent-silver hover:text-dark-bg font-semibold rounded-xl transition-all duration-300">
              <span>Watch Demo</span>
              <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-2 border-l-current border-y-2 border-y-transparent ml-0.5"></div>
              </div>
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-text-tertiary rounded-full flex justify-center">
              <div className="w-1 h-3 bg-text-tertiary rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
