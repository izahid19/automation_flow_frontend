import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage = 10 
}) => {
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
     if (totalItems > 0) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-end px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{totalItems}</span> of <span className="font-semibold text-foreground">{totalItems}</span> results
                </div>
            </div>
        )
     }
     return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 7;
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) pages.push('...');
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 3) pages.push('...');
      
      // Always show last page
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t w-full">
      <div className="flex items-center gap-1 sm:gap-4 flex-wrap justify-center sm:justify-start">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed group mr-1"
        >
          <ChevronLeft className="w-4 h-4 text-primary group-hover:-translate-x-0.5 transition-transform" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <div className="relative flex items-center justify-center">
                  {currentPage === page && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full scale-110 blur-[2px] animate-pulse-slow"></div>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all relative z-10 ${
                      currentPage === page
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-white/5"
                    }`}
                  >
                    {page}
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed group ml-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="text-sm text-muted-foreground font-medium">
        Showing <span className="text-foreground font-bold">{endItem > 0 ? startItem : 0}</span> to <span className="text-foreground font-bold">{endItem}</span> of <span className="text-foreground font-bold">{totalItems.toLocaleString()}</span> results
      </div>
    </div>
  );
};

export default Pagination;
