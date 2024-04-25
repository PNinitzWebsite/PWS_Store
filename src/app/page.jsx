"use client"


import { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import Modal from 'react-modal'; // นำเข้า Modal จาก React Modal
import './Home.css';

import { useRouter } from 'next/navigation'


import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable ,getDownloadURL} from 'firebase/storage';

export default function Home() {

  const router = useRouter();
  const [searchId, setSearchId] = useState('');


  const [accessToken, setAccessToken] = useState(null);
  const [productData, setProductData] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);

  const [imageURL, setImageURL] = useState([]);
  const [formMessage, setFormMessage] = useState('');

  

  // Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApGIZG22jN-a5PX1G69sCyAaqTd-9rcyM",
  authDomain: "dbstore-pninitz.firebaseapp.com",
  projectId: "dbstore-pninitz",
  storageBucket: "dbstore-pninitz.appspot.com",
  messagingSenderId: "405507602817",
  appId: "1:405507602817:web:6d42459badc094ca72d080",
  measurementId: "G-30BYCJF21X"
};




  

const uploadImageToFirebase = async (imageFiles) => {
  try {
    // ตรวจสอบว่า imageFiles เป็นอาร์เรย์หรือไม่
    if (!Array.isArray(imageFiles)) {
      throw new Error('imageFiles is not an array');
    }
    // สร้างอ้างอิง Storage
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    // สร้างอ้างอิง storage
    const storageRef = ref(storage);

    // สร้างอาร์เรย์เพื่อเก็บ URL ของไฟล์ที่อัปโหลดแล้ว
    const uploadedFileURLs = [];
    // เตรียมตัวแปรเพื่อเก็บ URL ของรูปภาพที่อัปโหลดแต่ละรูป
    const imageUrls = [];

    imageFiles.forEach(file => {
      const childPath = 'promotionwatchshop-' + file.name; // ระบุชื่อไฟล์และตำแหน่งที่ต้องการบน Firebase Storage
      const imageRef = ref(storage, childPath);
    
      const uploadTask = uploadBytesResumable(imageRef, file);
    
      uploadTask.on('state_changed', 
          (snapshot) => {
              console.log('Uploaded a blob or file!');
          },
          (error) => {
              console.error("เกิดข้อผิดพลาดในการอัปโหลด:", error);
          },
          async () => {
              console.log("อัปโหลดรูปเรียบร้อย");
    
              // รับ URL ของไฟล์ที่อัปโหลดแล้ว
              try {
                const downloadURL = await getDownloadURL(imageRef);
                uploadedFileURLs.push(downloadURL); // เพิ่ม URL ลงในอาร์เรย์
                console.log('File available at', downloadURL);
    
                // แสดง URL ที่ได้รับใน formMessage
                setFormMessage(prevMessage => {
                  if (prevMessage === '') {
                    return downloadURL;
                  } else {
                    return prevMessage + ', ' + downloadURL;
                  }
                });
                
              } catch (error) {
                console.error('Error getting download URL:', error);
              }
          }
      );
    });
    
    console.log('All uploaded file URLs:', uploadedFileURLs);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};


const refreshFormMessage = () => {
  setFormMessage('');
};


    
const handleFileChange = (e) => {
  const file = e.target.files;
  setEditedProduct(prevProduct => ({
    ...prevProduct,
    imageFile: file // กำหนดค่าไฟล์รูปภาพที่เลือกให้กับตัวแปร editedProduct.imageFile
  }));
};





const handleSaveChanges2 = () => {
  // ตรวจสอบว่ามีไฟล์รูปถูกเลือกหรือไม่
  if (editedProduct.imageFiles) {
    // อัปโหลดไฟล์รูปภาพไปยัง Firebase Storage
    uploadImageToFirebase(editedProduct.imageFiles);
    console.log(editedProduct.imageFiles);
     // ส่งอาร์เรย์ของไฟล์ภาพเป็นพารามิเตอร์
  } else {
    console.error("No image selected.");
  }
};
    

  

const handleSearch = () => {
  if (searchId == "") {
    window.location.reload();
  } else {
    fetchDataId(searchId);
  }
};
  
const fetchDataId = async (searchId) => {
  try {
      const app = new Realm.App({ id: 'data-whqji' });
      const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
      const user = await app.logIn(credentials);
      setAccessToken(user.accessToken);

      const requestData = {
        "collection": "watch_items",
        "database": "db_store",
        "dataSource": "dbstore",
        "filter": { "_id": searchId }
      };

      const url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-whqji/endpoint/data/v1/action/find';
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify(requestData)
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setProductData(data.documents);
      // console.log("Successssss!!!");
      // window.alert('ค้นข้อมูลสำเร็จ');
  } catch (error) {
      console.error('Fetch failed:', error);
  }
};


  useEffect(() => {
    const app = new Realm.App({ id: 'data-whqji' });

    const loginEmailPassword = async (email, password) => {
      try {
        const credentials = Realm.Credentials.emailPassword(email, password);
        const user = await app.logIn(credentials);
        console.assert(user.id === app.currentUser.id);
        setAccessToken(user.accessToken);

        const requestData = {
          "collection": "watch_items",
          "database": "db_store",
          "dataSource": "dbstore",
          "sort": { "CreatedAt": -1 }
        };

        const config = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'Authorization': `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify(requestData)
        };

        fetch('https://ap-southeast-1.aws.data.mongodb-api.com/app/data-whqji/endpoint/data/v1/action/find', config)
          .then(response => response.json())
          .then(data => {
            // console.log(data.documents);
            setProductData(data.documents);
          })
          .catch(error => console.log(error));

        
      } catch (error) {
        console.error('Login failed:', error.message);
      }
    };

    loginEmailPassword('1641010541194@rmutr.ac.th', 'Non13791');

  }, []);
  
  const fetchData = async (updatedProductData) => {
    try {
        const app = new Realm.App({ id: 'data-whqji' });
        const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
        const user = await app.logIn(credentials);
        setAccessToken(user.accessToken);

        const requestData = {
            "collection": "watch_items",
            "database": "db_store",
            "dataSource": "dbstore",
            "filter": {
                "_id": updatedProductData._id
            },
            "update": {
                "$set": {
                    "Name": updatedProductData.Name,
                    "Brand": updatedProductData.Brand,
                    "StoreBuy" :updatedProductData.StoreBuy,
                    "Colors": Array.isArray(updatedProductData.Colors) ? updatedProductData.Colors : updatedProductData.Colors.split(',').map(color => color.trim()),
                    "Waterproof": updatedProductData.Waterproof,
                    "Price": parseFloat(updatedProductData.Price), // แปลงเป็น decimal
                    "Description": updatedProductData.Description,
                    "Images": Array.isArray(updatedProductData.Images) ? updatedProductData.Images : updatedProductData.Images.split(',').map(image => image.trim()),
                    "Categories": Array.isArray(updatedProductData.Categories) ? updatedProductData.Categories : updatedProductData.Categories.split(',').map(Categories => Categories.trim())
                  }
            },
            "upsert": true
        };

        const url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-whqji/endpoint/data/v1/action/updateOne';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setProductData(data.documents);
        console.log("Successssss!!!");
        window.alert('อัปเดตเสร็จเรียบร้อยแล้ว');
        window.location.reload();
    } catch (error) {
        console.error('Fetch failed:', error);
    }
};






  useEffect(() => {
    return () => {
      clearInterval(intervalId);
    };
  }, [intervalId]);
  

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  
  

  

  // ฟังก์ชันที่ใช้ปิด Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    refreshFormMessage();
  };

  const handleSaveChanges = () => {
    // ส่งข้อมูลที่ต้องการอัปเดตไปยัง fetchData()
    fetchData(editedProduct);
    setIsModalOpen(false);
    refreshFormMessage();
  };


  const handleProductClick = (productId) => {
    const selectedProduct = productData.find(product => product._id === productId);
    setSelectedProduct(productId);
    setEditedProduct(selectedProduct);
    setIsModalOpen(true);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prevProduct => ({
      ...prevProduct,
      [name]: value
    }));
  };





  return (
    <main className="container mx-auto">
      <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-10 pt-6'>ข้อมูลสินค้า PWS | PromotionWatchShop</h1>
      <br /><hr />
      {accessToken ? (
        <>
        <div className="text-center pb-1 pt-5">
       
        <button class="button-35" role="button" onClick={() => router.push('/add-products')}>เพิ่มสินค้า</button>
        <button class="button-35" role="button" onClick={() => router.push('/add-orders')}>ขายสินค้า</button>
        <button class="button-35 " role="button" onClick={() => router.push('/orders-status')}>ตรวจสอบการชำระเงิน</button>
        
      
</div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-5 pb-6'>สินค้าที่มีทั้งหมด</h1>
          <div className='mx-auto text-center'>
          <label htmlFor="searchId">ใส่ ID เพื่อค้นหาสินค้า:</label>
      <input type="text" id="searchId" className='mt-1 mb-2 px-3 py-2 rounded-md shadow-xl sm:text-md' value={searchId} onChange={(e) => setSearchId(e.target.value)} />
      <button className='button-35' onClick={handleSearch}>ค้นหา</button>
          </div>
          
          <div className="bg-red-100">
            <div className='mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 '>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8 ">
                {productData?.map(product => (
                  <div key={product._id} className={`group relative bg-white rounded-lg p-2 border-double border-2   ${hoveredProductId === product._id ? 'border-red-600' : 'border-black'}`} onClick={() => handleProductClick(product._id)}>
                    <div className={`aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-black lg:aspect-none lg:h-80 group-hover:opacity-85`}>
                      <img
                        src={hoveredProductId === product._id ? (product.Images.length > 0 ? product.Images[hoverIndex] : 0) : product.Images[0]}
                        alt={product.Name}
                        className="h-full w-full object-cover object-center lg:h-full lg:w-full cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredProductId(product._id);
                          if (product.Images.length > 1) {
                            const id = setInterval(() => {
                              setHoverIndex(prevIndex => (prevIndex + 1) % product.Images.length);
                            }, 1300);
                            setIntervalId(id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredProductId(null);
                          setHoverIndex(0);
                          clearInterval(intervalId); // Clear interval when leaving
                        }}
                      />
                    </div>
                    <div className="mt-4 flex text-center">
                      <div className="mx-auto">
                      <p className="mb-2 text-md font-medium text-red-600">{product.StoreBuy}</p>
                        <h3 className="mt-1 text-lg text-black font-bold">
                          <span aria-hidden="true" className="absolute"></span>
                          {product._id}
                        </h3>
                        <h3 className="text-lg text-black font-bold">
                          <span aria-hidden="true" className="absolute"></span>
                          {product.Name}
                        </h3>
                        <h3 className="text-md text-black font-bold">
                          <span aria-hidden="true" className="absolute"></span>
                          แบรนด์ {product.Brand}
                        </h3>
                        <p className="mt-1 text-md text-gray-800">สี : {Array.isArray(product.Colors) ? product.Colors.join(', ') : product.Colors}</p>
                        <p className={`text-md font-bold ${product.Waterproof === 'กันน้ำ' ? 'text-blue-500' : 'text-red-500'}`}>สินค้า : {product.Waterproof}</p>
                        <p className="mb-2 text-md font-medium text-black">ราคา {formatPrice(product.Price)}</p>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>

          
        </>
      ) : (
        <>
        <p className="text-center">Logging in...</p> 
        
        </>
        
        
      )}




      {/* Modal */}
      <Modal
  isOpen={isModalOpen}
  onRequestClose={handleCloseModal}
  contentLabel="Product Details"
  productToUpdate={editedProduct}
>
  {/* แสดงข้อมูลสินค้าที่เลือก */}
  {accessToken ? (
    <>
    
      {productData?.map(product => {
        if (product._id === selectedProduct) {
          return (
            
            <div key={product._id} className={`group relative bg-white rounded-lg p-2 border-double border-2 ${hoveredProductId === product._id ? 'border-black' : 'border-black'}`}>
              {/* ปุ่มปิด Modal */}
              <div className="text-center pt-1 pb-2">
              <button class="button-27" role="button" onClick={handleCloseModal}>ปิด</button>
              </div>
             
              <div className={`aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-black lg:aspect-none lg:h-70`}>
                
                <img
                  src={hoveredProductId === product._id ? (product.Images.length > 0 ? product.Images[hoverIndex] : 0) : product.Images[0]}
                  alt={product.Name}
                  className="h-100 w-100 lg:h-100 lg:w-100 max-w-40 cursor-pointer object-center mx-auto"
                  onMouseEnter={() => {
                    setHoveredProductId(product._id);
                    if (product.Images.length > 1) {
                      const id = setInterval(() => {
                        setHoverIndex(prevIndex => (prevIndex + 1) % product.Images.length);
                      }, 1300);
                      setIntervalId(id);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredProductId(null);
                    setHoverIndex(0);
                    clearInterval(intervalId); // Clear interval when leaving
                  }}
                />
              </div>
              <div className="mt-4 flex">
                <div className="mx-auto">
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">ID สินค้า:</label>
                  <input type="text" id="_id" name="_id" value={product._id} className="mt-1 mb-2 px-3 py-2 block w-full text-white bg-black border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"  readOnly/>

                  <label htmlFor="Name" className="block text-md font-medium text-gray-700">ชื่อสินค้า:</label>
                  <input type="text" id="Name" name="Name" value={editedProduct.Name} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
                  <label htmlFor="Brand" className="block text-md font-medium text-gray-700">แบรนด์:</label>
<input type="text" id="Brand" name="Brand" value={editedProduct.Brand} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Colors" className="block text-md font-medium text-gray-700">สี:</label>
<input type="text" id="Colors" name="Colors" value={Array.isArray(editedProduct.Colors) ? editedProduct.Colors.join(', ') : editedProduct.Colors} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Waterproof" className="block text-md font-medium text-gray-700">สินค้า:</label>
<select id="Waterproof" name="Waterproof" value={editedProduct.Waterproof} onChange={handleChange} className={`mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md ${editedProduct.isWaterproof === 'กันน้ำ' ? 'text-blue-500' : 'text-red-500'}`}>
  <option value="เลือกก่อน">เลือกก่อน</option>
  <option value="กันน้ำ">กันน้ำ</option>
  <option value="ไม่กันน้ำ">ไม่กันน้ำ</option>
</select>
<label htmlFor="Price" className="block text-md font-medium text-gray-700">ราคา:</label>
<input type="text" id="Price" name="Price" value={editedProduct.Price} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Categories" className="block text-md font-medium text-gray-700">หมวดหมู่:</label>
<textarea id="Categories" rows="3" name="Categories" value={Array.isArray(editedProduct.Categories) ? editedProduct.Categories.join(', ') : editedProduct.Categories} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<label htmlFor="Description" className="block text-md font-medium text-gray-700">ข้อความสินค้า:</label>
<textarea id="Description" name="Description" rows="4" value={editedProduct.Description} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<label htmlFor="StoreBuy" className="block text-md font-medium text-gray-700">ร้านขายส่ง (ดูได้เฉพาะเรา):</label>
<select id="StoreBuy" name="StoreBuy" value={editedProduct ? editedProduct.StoreBuy:''} onChange={handleChange} className={`mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md `}>
  <option value="เลือกก่อน" disabled selected>เลือกก่อน</option>
  <option value="vbshop">vbshop</option>
  <option value="niceshop">niceshop</option>
</select>

<label htmlFor="Images" className="block text-md font-medium text-gray-700">รูป:</label>
<textarea id="Images" rows="4" name="Images" value={Array.isArray(editedProduct.Images) ? editedProduct.Images.join(', ') : editedProduct.Images} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />



      <div className="text-center pt-1">
      <button class="button-35" role="button" onClick={handleSaveChanges}>บันทึก</button>
      </div>
                  {/* ปุ่มบันทึกการเปลี่ยนแปลง */}
      
     
      <br /><br />
      <label htmlFor="image" className="block text-md font-medium text-gray-700">เลือกรูปภาพอัพโหลดใหม่:</label>
      <input
  type="file"
  id="image"
  name="image"
  accept="image/*"
  onChange={(e) => {
    const files = Array.from(e.target.files); // เก็บรายการของไฟล์ทั้งหมดในอาร์เรย์
    setEditedProduct((prevProduct) => ({
      ...prevProduct,
      imageFiles: files, // เก็บอาร์เรย์ของไฟล์ภาพที่ผู้ใช้เลือก
    }));
  }}
  multiple
  className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
/>

<label htmlFor="imageURL" className="block text-md font-medium text-gray-700">ลิงค์ภาพใหม่ที่อัพโหลด:</label>
<textarea id="imageURL" name="imageURL" rows="4" value={formMessage} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<div className="text-center pb-10 pt-1">
      <button class="button-35" role="button" onClick={handleSaveChanges2}>อัพโหลด</button>
</div>
                </div>
              </div>
            </div>
          );
        }
      })}
      
      
    </>
  ) : (
    
    <h1 className="text-center font-bold">Logging in...</h1> 
  )}
</Modal>


    </main>
  );
  
}
