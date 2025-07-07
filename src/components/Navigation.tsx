'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Plus, Settings, LogOut, Menu, X, Sparkles, Users, Building2, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useNavigation();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button 
          onClick={toggleMenu}
          className="p-2 bg-white rounded-md shadow-md border border-gray-200"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Sidebar Navigation */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${
          isCollapsed ? 'md:w-16' : 'md:w-64'
        } w-64`}
      >
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
            {!isCollapsed ? (
              <>
                <h1 className="text-xl font-bold text-gray-800">Daily Logs</h1>
                <p className="text-sm text-gray-600">Construction Management</p>
              </>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DL</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button - Desktop Only */}
          <div className="hidden md:block absolute -right-3 top-8 z-50">
            <button
              onClick={toggleCollapse}
              className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronLeft className="w-3 h-3 text-gray-600" />
              )}
            </button>
          </div>
          
          <nav className={`flex-1 py-4 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <Link 
              href="/dashboard" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/dashboard') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
            
            <Link 
              href="/logs" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/logs') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "All Logs" : ""}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>All Logs</span>}
            </Link>
            
            <Link 
              href="/logs/new" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/logs/new') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "New Log" : ""}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>New Log</span>}
            </Link>
            
            <Link 
              href="/projects" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/projects') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "Projects" : ""}
            >
              <Building2 className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Projects</span>}
            </Link>
            
            <Link 
              href="/action-items" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/action-items') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "Action Items" : ""}
            >
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Action Items</span>}
            </Link>
            
            <Link 
              href="/contractors" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/contractors') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "Contractors" : ""}
            >
              <Building2 className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Contractors</span>}
            </Link>
            
            <Link 
              href="/crew-members" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/crew-members') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "Crew Members" : ""}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Crew Members</span>}
            </Link>
            
            <Link 
              href="/assistant" 
              className={`flex items-center rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
              } ${
                isActive('/assistant') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
              title={isCollapsed ? "AI Assistant" : ""}
            >
              <Sparkles className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>AI Assistant</span>}
            </Link>
            
            <div className={`pt-4 mt-4 border-t border-gray-200 ${isCollapsed ? 'border-t-0 pt-2 mt-2' : ''}`}>
              <Link 
                href="/settings" 
                className={`flex items-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
                }`}
                onClick={closeMenu}
                title={isCollapsed ? "Settings" : ""}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </Link>
              
              <button 
                className={`w-full flex items-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
                }`}
                onClick={closeMenu}
                title={isCollapsed ? "Sign Out" : ""}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
