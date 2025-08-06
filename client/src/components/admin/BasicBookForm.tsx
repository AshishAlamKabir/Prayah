export default function BasicBookForm() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#b91c1c', fontSize: '24px', fontWeight: 'bold' }}>Book Management</h1>
        <button 
          onClick={() => {
            const formDiv = document.getElementById('book-form-container');
            const dashboardDiv = document.getElementById('book-dashboard');
            if (formDiv && dashboardDiv) {
              formDiv.style.display = 'block';
              dashboardDiv.style.display = 'none';
            }
          }}
          style={{
            backgroundColor: '#b91c1c',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + Add New Book
        </button>
      </div>

      <div id="book-dashboard" style={{ display: 'block' }}>
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: '32px', color: '#b91c1c' }}>+</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
            Ready to Add Books
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Click the "Add New Book" button above to start adding books to your store. 
            Books you add will be available for purchase in the public book store.
          </p>
          <button 
            onClick={() => {
              const formDiv = document.getElementById('book-form-container');
              const dashboardDiv = document.getElementById('book-dashboard');
              if (formDiv && dashboardDiv) {
                formDiv.style.display = 'block';
                dashboardDiv.style.display = 'none';
              }
            }}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Get Started
          </button>
        </div>
      </div>

      <div id="book-form-container" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#b91c1c', fontSize: '24px', fontWeight: 'bold' }}>Add New Book</h1>
          <button 
            onClick={() => {
              const formDiv = document.getElementById('book-form-container');
              const dashboardDiv = document.getElementById('book-dashboard');
              if (formDiv && dashboardDiv) {
                formDiv.style.display = 'none';
                dashboardDiv.style.display = 'block';
              }
            }}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: 'white'
        }}>
          <h2 style={{ color: '#16a34a', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Book Information
          </h2>
          
          <form id="book-form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            
            // Get form values
            const title = formData.get('title') as string;
            const author = formData.get('author') as string;
            const price = formData.get('price') as string;
            const coverImage = formData.get('coverImage') as File;
            
            // Basic validation
            if (!title || !author || !price) {
              alert('Please fill in title, author, and price');
              return;
            }
            
            if (!coverImage || coverImage.size === 0) {
              alert('Please upload a cover image');
              return;
            }
            
            // Create FormData for API submission
            const apiFormData = new FormData();
            apiFormData.append('title', title);
            apiFormData.append('author', author);
            apiFormData.append('price', price);
            apiFormData.append('description', formData.get('description') as string || '');
            apiFormData.append('category', formData.get('category') as string || '');
            apiFormData.append('quantity', formData.get('quantity') as string || '0');
            apiFormData.append('subscriptionOnly', 'false');
            apiFormData.append('featured', 'false');
            apiFormData.append('bookType', 'paperback');
            apiFormData.append('tags', JSON.stringify([]));
            apiFormData.append('coverImage', coverImage);
            
            // Submit to API
            fetch('/api/admin/books', {
              method: 'POST',
              body: apiFormData
            })
            .then(response => response.json())
            .then(data => {
              alert('Book added successfully to the store!');
              (document.getElementById('book-form') as HTMLFormElement).reset();
              const formDiv = document.getElementById('book-form-container');
              const dashboardDiv = document.getElementById('book-dashboard');
              if (formDiv && dashboardDiv) {
                formDiv.style.display = 'none';
                dashboardDiv.style.display = 'block';
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert('Failed to add book. Please try again.');
            });
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Book Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter book title"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Author *
                  </label>
                  <input
                    type="text"
                    name="author"
                    placeholder="Enter author name"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g., Education, Culture, History"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Enter stock quantity"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Cover Image *
                  </label>
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <input
                      type="file"
                      name="coverImage"
                      accept="image/*"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      Upload a book cover image (max 5MB)
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Enter book description"
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Add Book to Store
              </button>
              
              <button
                type="button"
                onClick={() => {
                  (document.getElementById('book-form') as HTMLFormElement).reset();
                }}
                style={{
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}