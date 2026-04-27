import { useState, useEffect } from 'react';

function PhotographyPage() {
  const [photos, setPhotos] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const modules = import.meta.glob('../assets/PHOTOGRAPHY/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF}');
    const urls = Object.keys(modules).map(key => modules[key]().then(m => m.default));
    Promise.all(urls).then(setPhotos).catch(console.error);
  }, []);

  return (
    <>
      <section className="section has-navbar-fixed-top">
        <div className="container">
          <h1 className="title is-3">Photography</h1>
          <div className="columns is-multiline">
            {photos.map((src, idx) => (
              <div key={idx} className="column is-6-tablet is-4-desktop is-3-widescreen">
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div className="card-image">
                    <figure className="image is-4by3">
                      <img
                        src={src}
                        alt={`photo-${idx}`}
                        style={{ objectFit: 'cover' }}
                        onClick={() => setSelectedImage(src)}
                      />
                    </figure>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div
          className="modal is-active"
          onClick={() => setSelectedImage(null)}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="modal-background" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}></div>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: 'auto', maxWidth: '95vw', maxHeight: '95vh', margin: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={selectedImage}
              alt="preview"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                borderRadius: '4px',
              }}
            />
          </div>
          <button
            className="modal-close is-large"
            aria-label="close"
            onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
          />
        </div>
      )}
    </>
  );
}

export default PhotographyPage;