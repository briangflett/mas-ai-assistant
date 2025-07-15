'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, Heart, Building, HelpCircle, ArrowRight, ArrowLeft, Sparkles, Mail, Lock, Globe } from 'lucide-react';

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [identificationMethod, setIdentificationMethod] = useState('');
  const [email, setEmail] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const roles = [
    {
      id: 'mas-client',
      title: 'MAS Client',
      description: 'I work for a nonprofit that has received or is seeking consulting services from MAS',
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      id: 'mas-staff-vc',
      title: 'MAS Staff / Volunteer Consultant', 
      description: 'I work for MAS or provide pro bono consulting services through MAS',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      id: 'canadian-charity',
      title: 'Canadian Charity Staff / Volunteer / Board Member',
      description: 'I work for, volunteer with, or serve on the board of a Canadian nonprofit',
      icon: Heart,
      color: 'bg-purple-500'
    },
    {
      id: 'other',
      title: 'Other (please specify)',
      description: 'I have a different role or background',
      icon: HelpCircle,
      color: 'bg-gray-500'
    }
  ];

  const getTopicsForRole = (roleId: string) => {
    const baseTopics = [
      'AI',
      'Planning', 
      'Governance',
      'HR',
      'Fundraising',
      'Finance & IT',
      'Marketing & Communications'
    ];

    if (roleId === 'mas-staff-vc') {
      return [...baseTopics, 'Using CiviCRM', 'Implementing CiviCRM', 'Other'];
    }
    return [...baseTopics, 'Other'];
  };

  const getIdentificationOptions = (roleId: string) => {
    switch (roleId) {
      case 'mas-client':
        return [
          { id: 'email', label: 'Provide email', icon: Mail },
          { id: 'anonymous', label: 'Continue anonymously', icon: Globe }
        ];
      case 'mas-staff-vc':
        return [
          { id: 'microsoft-login', label: 'Log in (Microsoft)', icon: Lock, primary: true, note: 'Required for VC Templates & project history' },
          { id: 'email', label: 'Provide email', icon: Mail },
          { id: 'anonymous', label: 'Continue anonymously', icon: Globe }
        ];
      case 'canadian-charity':
      case 'other':
        return [
          { id: 'email', label: 'Provide email', icon: Mail },
          { id: 'anonymous', label: 'Continue anonymously', icon: Globe }
        ];
      default:
        return [];
    }
  };

  const getDataAccess = () => {
    if (selectedRole === 'mas-staff-vc' && identificationMethod === 'microsoft-login') {
      return ['Publicly Available', 'VC Templates', 'Project History'];
    }
    return ['Publicly available'];
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedTopic('');
    setIdentificationMethod('');
    setEmail('');
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      handleContinue();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    setIsTransitioning(true);
    
    const userProfile = {
      role: selectedRole,
      customRole,
      topic: selectedTopic,
      customTopic,
      identification: identificationMethod,
      email,
      dataAccess: getDataAccess()
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    setTimeout(() => {
      router.push('/chat');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedRole && (!selectedRole.includes('other') || customRole.trim());
      case 2:
        return selectedTopic && (!selectedTopic.includes('Other') || customTopic.trim());
      case 3:
        return identificationMethod && (identificationMethod !== 'email' || email.trim());
      default:
        return false;
    }
  };

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MAS AI Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome! I&apos;m here to help with nonprofit consulting, CiviCRM guidance, and organizational strategy.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-sm text-gray-600">
            {currentStep === 1 && "Your Role"}
            {currentStep === 2 && "Topic of Interest"}
            {currentStep === 3 && "Identification"}
          </div>
        </div>

        {!isTransitioning ? (
          <>
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  What best describes your role?
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`
                          cursor-pointer p-6 rounded-xl border-2 transition-all duration-200
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 transform scale-[1.02]' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`${role.color} p-3 rounded-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {role.title}
                            </h3>
                            <p className="text-gray-600">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedRole === 'other' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="customRole" className="block text-sm font-medium text-gray-700 mb-3">
                      Please describe your role or background:
                    </label>
                    <textarea
                      id="customRole"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g., Board member at a health charity, Fundraising consultant, Government employee working with nonprofits..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Topic Selection */}
            {currentStep === 2 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  What topic are you interested in?
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {getTopicsForRole(selectedRole).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${selectedTopic === topic
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <span className="font-medium">{topic}</span>
                    </button>
                  ))}
                </div>

                {selectedTopic === 'Other' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="customTopic" className="block text-sm font-medium text-gray-700 mb-3">
                      Please specify your topic of interest:
                    </label>
                    <input
                      type="text"
                      id="customTopic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., Board development, Volunteer management, Strategic partnerships..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Identification */}
            {currentStep === 3 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  Please identify yourself
                </h2>
                
                <div className="space-y-4">
                  {getIdentificationOptions(selectedRole).map((option) => {
                    const Icon = option.icon;
                    const isSelected = identificationMethod === option.id;
                    
                    return (
                      <div key={option.id}>
                        <button
                          onClick={() => setIdentificationMethod(option.id)}
                          className={`
                            w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }
                            ${option.primary ? 'ring-2 ring-blue-200' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                              {option.label}
                            </span>
                            {option.primary && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          {option.note && (
                            <p className="text-sm text-gray-500 mt-2 ml-8">{option.note}</p>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {identificationMethod === 'email' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                      Email address:
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`
                  inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${currentStep === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }
                `}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`
                  inline-flex items-center px-8 py-3 rounded-lg font-medium transition-all duration-200
                  ${canProceed()
                    ? currentStep === 3 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg'
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {currentStep === 3 ? (
                  <>
                    <MessageCircle className="mr-3 h-5 w-5" />
                    Start Conversation
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Transition State */
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Initializing your AI assistant...
            </h3>
            <p className="text-gray-600 mb-4">
              Configuring data access and preparing your personalized experience
            </p>
            <div className="max-w-md mx-auto bg-gray-100 rounded-lg p-4">
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-medium">{selectedRoleData?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Topic:</span>
                  <span className="font-medium">{selectedTopic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Access:</span>
                  <span className="font-medium">
                    {getDataAccess().length > 1 ? 'Enhanced' : 'Public'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            Powered by MAS AI Framework • 
            <a href="https://masadvise.org" className="text-blue-600 hover:text-blue-700 ml-1">
              Learn more about MAS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}