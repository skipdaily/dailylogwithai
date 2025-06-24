'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Plus, Settings, LogOut, Menu, X, Sparkles, Users, Building2, CheckSquare } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Daily Logs</h1>
            <p className="text-sm text-gray-600">Construction Management</p>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1">
            <Link 
              href="/dashboard" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/dashboard') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/logs" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/logs') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <FileText className="h-5 w-5" />
              <span>All Logs</span>
            </Link>
            
            <Link 
              href="/logs/new" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/logs/new') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <Plus className="h-5 w-5" />
              <span>New Log</span>
            </Link>
            
            <Link 
              href="/projects" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/projects') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <Building2 className="h-5 w-5" />
              <span>Projects</span>
            </Link>
            
            <Link 
              href="/action-items" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/action-items') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <CheckSquare className="h-5 w-5" />
              <span>Action Items</span>
            </Link>
            
            <Link 
              href="/contractors" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/contractors') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <Building2 className="h-5 w-5" />
              <span>Contractors</span>
            </Link>
            
            <Link 
              href="/crew-members" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/crew-members') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <Users className="h-5 w-5" />
              <span>Crew Members</span>
            </Link>
            
            <Link 
              href="/assistant" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive('/assistant') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <Sparkles className="h-5 w-5" />
              <span>AI Assistant</span>
            </Link>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link 
                href="/settings" 
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={closeMenu}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={closeMenu}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
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
