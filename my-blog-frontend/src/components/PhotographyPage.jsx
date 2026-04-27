import { useState, useEffect } from 'react';

function PhotographyPage() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    // 动态导入所有图片，支持常见格式
    const modules = import.meta.glob('../assets/PHOTOGRAPHY/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF}');
    const urls = Object.keys(modules).map(key => modules[key]().then(m => m.default));
    Promise.all(urls).then(setPhotos).catch(console.error);
  }, []);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h1 className="title is-3">Photography</h1>
        <div className="columns is-multiline">
          {photos.map((src, idx) => (
            <div key={idx} className="column is-6-tablet is-4-desktop is-3-widescreen">
              <div className="card">
                <div className="card-image">
                  <figure className="image is-4by3">
                    <img src={src} alt={`photo-${idx}`} style={{ objectFit: 'cover' }} />
                  </figure>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PhotographyPage;