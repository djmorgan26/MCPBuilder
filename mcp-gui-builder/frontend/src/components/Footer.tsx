import React from 'react';
import { Github, Twitter, Mail, ArrowUp } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-dark-surface border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-silver to-accent-neon rounded-lg flex items-center justify-center">
                  <span className="text-dark-bg font-bold text-sm">M</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-accent-silver to-accent-neon rounded-lg blur-sm opacity-30"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary font-apple">MCP Builder</h3>
                <p className="text-sm text-text-tertiary">Professional Server Studio</p>
              </div>
            </div>
            <p className="text-text-secondary mb-6 max-w-md">
              The premium visual builder for Model Context Protocol servers. 
              Create enterprise-grade AI infrastructure with professional tools and components.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/djmorgan26/MCPBuilder"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-text-tertiary hover:text-accent-neon rounded-lg hover:bg-dark-card transition-all duration-200"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-text-tertiary hover:text-accent-neon rounded-lg hover:bg-dark-card transition-all duration-200"
                title="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@mcpbuilder.com"
                className="p-2 text-text-tertiary hover:text-accent-neon rounded-lg hover:bg-dark-card transition-all duration-200"
                title="Email Support"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-6 font-apple">Products</h4>
            <ul className="space-y-3">
              <li>
                <a href="#products" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Tool Collection
                </a>
              </li>
              <li>
                <a href="#configurator" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Build Configurator
                </a>
              </li>
              <li>
                <a href="#checkout" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Deployment
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Enterprise Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-6 font-apple">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-text-tertiary text-sm mb-4 md:mb-0">
            © 2024 MCP Builder. All rights reserved. Built with professional standards.
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors duration-200">
              Security
            </a>
          </div>

          {/* Back to Top */}
          <button
            onClick={scrollToTop}
            className="mt-4 md:mt-0 p-3 bg-dark-card border border-dark-border rounded-xl text-text-tertiary hover:text-accent-neon hover:border-accent-silver transition-all duration-200 transform hover:scale-105"
            title="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
