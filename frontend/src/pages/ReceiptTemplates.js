import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ReceiptTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    header: '',
    footer: '',
    show_logo: true,
    show_customer_info: true,
    show_items: true,
    show_totals: true,
    paper_size: 'A4',
    font_size: 'medium'
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // For now, use mock data since backend endpoint doesn't exist yet
      const mockTemplates = [
        {
          id: 1,
          name: 'Standard Receipt',
          header: 'Thank you for your purchase!',
          footer: 'Please come again',
          show_logo: true,
          show_customer_info: true,
          show_items: true,
          show_totals: true,
          paper_size: 'A4',
          font_size: 'medium',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Thermal Printer',
          header: 'POS System',
          footer: 'Thank you!',
          show_logo: false,
          show_customer_info: true,
          show_items: true,
          show_totals: true,
          paper_size: 'thermal',
          font_size: 'small',
          created_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch receipt templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    
    if (!templateForm.name) {
      toast.error('Template name is required');
      return;
    }

    try {
      // For now, just add to local state since backend endpoint doesn't exist
      const newTemplate = {
        id: Date.now(),
        ...templateForm,
        created_at: new Date().toISOString()
      };
      
      setTemplates([newTemplate, ...templates]);
      toast.success('Template created successfully');
      setShowModal(false);
      setTemplateForm({
        name: '',
        header: '',
        footer: '',
        show_logo: true,
        show_customer_info: true,
        show_items: true,
        show_totals: true,
        paper_size: 'A4',
        font_size: 'medium'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receipt Templates</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 w-full sm:w-auto justify-center transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Template
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No templates found</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{template.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setTemplateForm(template);
                      setShowModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Paper Size:</span> {template.paper_size}</p>
                <p><span className="font-medium">Font Size:</span> {template.font_size}</p>
                <p><span className="font-medium">Header:</span> {template.header || 'None'}</p>
                <p><span className="font-medium">Footer:</span> {template.footer || 'None'}</p>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {template.show_logo && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Logo
                  </span>
                )}
                {template.show_customer_info && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Customer Info
                  </span>
                )}
                {template.show_items && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Items
                  </span>
                )}
                {template.show_totals && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    Totals
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {templateForm.id ? 'Edit Template' : 'Create Template'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paper Size
                    </label>
                    <select
                      value={templateForm.paper_size}
                      onChange={(e) => setTemplateForm({ ...templateForm, paper_size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="A4">A4</option>
                      <option value="thermal">Thermal (80mm)</option>
                      <option value="letter">Letter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Size
                    </label>
                    <select
                      value={templateForm.font_size}
                      onChange={(e) => setTemplateForm({ ...templateForm, font_size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Header Text
                  </label>
                  <textarea
                    value={templateForm.header}
                    onChange={(e) => setTemplateForm({ ...templateForm, header: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter header text..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Footer Text
                  </label>
                  <textarea
                    value={templateForm.footer}
                    onChange={(e) => setTemplateForm({ ...templateForm, footer: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter footer text..."
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Options
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.show_logo}
                        onChange={(e) => setTemplateForm({ ...templateForm, show_logo: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Logo</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.show_customer_info}
                        onChange={(e) => setTemplateForm({ ...templateForm, show_customer_info: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Customer Info</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.show_items}
                        onChange={(e) => setTemplateForm({ ...templateForm, show_items: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Items</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.show_totals}
                        onChange={(e) => setTemplateForm({ ...templateForm, show_totals: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Totals</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {templateForm.id ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Template Preview: {selectedTemplate.name}</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-900">
                {/* Mock receipt preview */}
                <div className="text-center space-y-4">
                  {selectedTemplate.show_logo && (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">LOGO</div>
                  )}
                  
                  {selectedTemplate.header && (
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{selectedTemplate.header}</div>
                  )}
                  
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                    <div className="text-left space-y-2">
                      {selectedTemplate.show_customer_info && (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Customer: John Doe</p>
                          <p className="text-gray-600 dark:text-gray-400">Phone: (555) 123-4567</p>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                        <p className="font-medium text-gray-900 dark:text-white">Invoice: #INV-001</p>
                        <p className="text-gray-600 dark:text-gray-400">Date: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTemplate.show_items && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-gray-600">
                            <th className="text-gray-900 dark:text-white">Item</th>
                            <th className="text-gray-900 dark:text-white">Qty</th>
                            <th className="text-gray-900 dark:text-white">Price</th>
                            <th className="text-gray-900 dark:text-white">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-gray-600 dark:text-gray-400">Sample Item 1</td>
                            <td className="text-gray-600 dark:text-gray-400">2</td>
                            <td className="text-gray-600 dark:text-gray-400">$10.00</td>
                            <td className="text-gray-600 dark:text-gray-400">$20.00</td>
                          </tr>
                          <tr>
                            <td className="text-gray-600 dark:text-gray-400">Sample Item 2</td>
                            <td className="text-gray-600 dark:text-gray-400">1</td>
                            <td className="text-gray-600 dark:text-gray-400">$15.00</td>
                            <td className="text-gray-600 dark:text-gray-400">$15.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {selectedTemplate.show_totals && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4 text-right">
                      <div className="space-y-1">
                        <p className="text-gray-600 dark:text-gray-400">Subtotal: $35.00</p>
                        <p className="text-gray-600 dark:text-gray-400">Tax: $3.50</p>
                        <p className="font-bold text-gray-900 dark:text-white">Total: $38.50</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedTemplate.footer && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                      <p className="text-gray-600 dark:text-gray-400">{selectedTemplate.footer}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptTemplates;