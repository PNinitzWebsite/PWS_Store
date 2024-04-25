// `app/dashboard/page.js` is the UI for the `/dashboard` URL
"use client"
import { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import Modal from 'react-modal'; // นำเข้า Modal จาก React Modal
import '../Home.css';

import { useRouter } from 'next/navigation'


import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable ,getDownloadURL} from 'firebase/storage';


export default function AddProduct() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState(null);
  const [productData, setProductData] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    _id: '',
    Name: '',
    Brand: '',
    Colors: '',
    Waterproof: '',
    Price: '',
    Description: '',
    Images: '',
    Categories: ''
  });

  const [imageURL, setImageURL] = useState([]);
  const [formMessage, setFormMessage] = useState('');

  const [productId, setProductId] = useState('');

  //genID
  useEffect(() => {
    return () => {
      generateRandomId();
    };
  }, []);

  const generateRandomId = () => {
    let id = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i++) {
      id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    checkIdDuplicate(id);
  };
  
  const checkIdDuplicate = async (id) => {
    try {
      // ตรวจสอบว่า _id ที่สร้างขึ้นซ้ำกับข้อมูลที่มีอยู่ใน MongoDB หรือไม่
      const app = new Realm.App({ id: 'data-whqji' });
      const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
      const user = await app.logIn(credentials);
  
      const requestData = {
        "collection": "watch_items",
        "database": "db_store",
        "dataSource": "dbstore",
        "filter": {
          "_id": id
        }
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
  
      const data = await response.json();
      if (data.documents.length > 0) {
        // ถ้าพบ _id ที่ซ้ำกับ MongoDB ให้สร้าง _id ใหม่อีกครั้ง
        const newId = generateRandomId();
        return checkIdDuplicate(newId); // เรียกตัวเองเพื่อตรวจสอบ _id ใหม่
      } else {
        // ถ้า _id ไม่ซ้ำกับ MongoDB ส่ง _id กลับ
        return setProductId(id);
      }
    } catch (error) {
      console.error('Check duplicate ID failed:', error);
      throw new Error('Check duplicate ID failed');
    }
  };
  
  const handleGenerateId = async () => {
    try {
      const id = generateRandomId();
      const uniqueId = await checkIdDuplicate(id);
      setProductId(uniqueId);
    } catch (error) {
      console.error('Generate ID failed:', error);
    }
  };
  

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
          "dataSource": "dbstore"
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
            setEditedProduct(data.documents);
            console.log(editedProduct ? editedProduct._id : '');
          })
          .catch(error => console.log(error));


         
        
      } catch (error) {
        console.error('Login failed:', error.message);
      }
    };

    loginEmailPassword('1641010541194@rmutr.ac.th', 'Non13791');
    
  }, []);
  
  const fetchData = async (editedProduct, productId) => {
    try {
      // เพิ่มเวลาที่เพิ่มสินค้าลงใน MongoDB
      const currentTime = new Date().toISOString();
  
      const app = new Realm.App({ id: 'data-whqji' });
      const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
      const user = await app.logIn(credentials);
      setAccessToken(user.accessToken);
  
      const requestData = {
        "collection": "watch_items",
        "database": "db_store",
        "dataSource": "dbstore",
        "document": {
          "_id": productId,
          "Name": editedProduct.Name,
          "Brand": editedProduct.Brand,
          "StoreBuy":editedProduct.StoreBuy,
          "Colors": Array.isArray(editedProduct.Colors) ? editedProduct.Colors : editedProduct.Colors.split(',').map(color => color.trim()),
          "Waterproof": editedProduct.Waterproof,
          "Price": parseFloat(editedProduct.Price), // แปลงเป็น decimal
          "Description": editedProduct.Description,
          "Images": Array.isArray(editedProduct.Images) ? editedProduct.Images :editedProduct.Images.split(',').map(image => image.trim()),
          "Categories": Array.isArray(editedProduct.Categories) ? editedProduct.Categories : editedProduct.Categories.split(',').map(Categories => Categories.trim()),
          "CreatedAt": currentTime // เพิ่มเวลาที่สร้างข้อมูล
        }
      };
  
      const url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-whqji/endpoint/data/v1/action/insertOne';
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
      window.alert(`เพิ่มข้อมูลสินค้าใหม่ ${productId} สำเร็จแล้ว`);
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

  const handleSaveChanges = async (e) => {
    try {
      // ส่งข้อมูลที่ต้องการอัปเดตไปยัง fetchData()
      e.preventDefault();
      await fetchData(editedProduct,productId);
      refreshFormMessage();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
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
    <main className="container mx-auto bg-yellow-500">
      <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-10 pt-6'>เพิ่มข้อมูลสินค้า PWS | PromotionWatchShop</h1>
      <br /><hr />
      {accessToken ? (
        <>
        <div className="text-center pb-1 pt-5 ">
        <button class="button-35 " role="button" onClick={() => router.push('/')}>สินค้าในคลัง</button>
        <button class="button-35 " role="button" onClick={() => router.push('/orders')}>ออเดอร์ทั้งหมด</button>
        
        </div>
      

          <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-5 pb-6'>เพิ่มข้อมูลสินค้า</h1>
            
            <div className={`group relative bg-white rounded-lg p-2 border-double border-2`}>
             
              <div className={`aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-black lg:aspect-none lg:h-70`}>
                
                
              </div>
              <div className="mt-4 flex">
                <div className="mx-auto">
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">ID สินค้า:</label>
                  <input
  type="text"
  id="_id"
  name="_id"
  value={productId}
  onChange={(e) => setProductId(e.target.value)}
  className="mt-1 mb-2 px-3 py-2 block w-full text-white bg-black border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
  readOnly
/>

                  <label htmlFor="Name" className="block text-md font-medium text-gray-700">ชื่อสินค้า:</label>
                  <input placeholder='เช่น W-737HX-5AV' type="text" id="Name" name="Name" value={editedProduct.Name} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
                  <label htmlFor="Brand" className="block text-md font-medium text-gray-700">แบรนด์:</label>
<input placeholder='เช่น CASIO' type="text" id="Brand" name="Brand" value={editedProduct ? editedProduct.Brand : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md uppercase" />
<label htmlFor="Colors" className="block text-md font-medium text-gray-700">สี:</label>
<textarea rows="8" placeholder='เช่น สีเขียว,สีดำ,สีเหลือง' type="text" id="Colors" name="Colors" value={editedProduct ? editedProduct.Colors : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Waterproof" className="block text-md font-medium text-gray-700">สินค้า:</label>
<select id="Waterproof" name="Waterproof" value={editedProduct ? editedProduct.Waterproof:'เลือกก่อน'} onChange={handleChange} className={`mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md `}>
  <option value="เลือกก่อน"select selected disabled>เลือกก่อน</option>
 
  <option value="ไม่กันน้ำ">ไม่กันน้ำ</option>
  <option value="กันน้ำ">กันน้ำ</option>
</select>
<label htmlFor="Price" className="block text-md font-medium text-gray-700">ราคา:</label>
<input placeholder='เช่น 3170' type="text" id="Price" name="Price" value={editedProduct ? editedProduct.Price : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Categories" className="block text-md font-medium text-gray-700">หมวดหมู่: เช่น JUNJIA,แฟชั่น,ผู้หญิง,นาฬิกาข้อมือ</label>
<textarea placeholder='เช่น JUNJIA,แฟชั่น,ผู้หญิง' id="Categories" rows="3" name="Categories" value={editedProduct ? editedProduct.Categories : 'JUNJIA,แฟชั่น,ผู้หญิง'} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<label htmlFor="Description" className="block text-md font-medium text-gray-700">ข้อความสินค้า:</label>
<textarea placeholder='เช่น ต้องบอกว่านาฬิกาสายลุยจาก Casio รุ่นนี้เป็นทรงที่เราทุกคนน่าจะคุ้นหน้า คุ้นตากันบ้างอยู่แล้วใช่ไหมคะ นาฬิกาเรือนนี้เค้ามาพร้อมกับสายยาวพิเศษเพื่อการสวมใส่ที่สบาย นอกจากนี้นาฬิการุ่นนี้ยังมาพร้อมกับคุณสมบัติที่ใช้งานสะดวกในทุกๆ วัน ไม่ว่าจะใช้จับเวลา ใช้ปลุก ปฎิทิน และฟังก์ชันบอกเวลาสองระบบ น้องดือมากแถมมีให้เลือกด้วยกันสองสีใครชอบสีไหนก็เลือกได้เล้ยย

จุดเด่น :

กันน้ำได้ 100 เมตร
แบตเตอรี่มีอายุการใช้งานได้ยาวนานถึง 10 ปี
มีปุ่มด้านหน้าช่วยให้คุณใช้แสงพื้นหลัง LED ได้ง่าย' id="Description" name="Description" rows="4" value={editedProduct ? editedProduct.Description : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<label htmlFor="StoreBuy" className="block text-md font-medium text-gray-700">ร้านขายส่ง (ดูได้เฉพาะเรา):</label>
<select id="StoreBuy" name="StoreBuy" value={editedProduct ? editedProduct.StoreBuy:''} onChange={handleChange} className={`mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md `}>
  <option value="เลือกก่อน" disabled selected>เลือกก่อน</option>
  <option value="vbshop">vbshop</option>
  <option value="niceshop">niceshop</option>
</select>

<label htmlFor="Images" className="block text-md font-medium text-gray-700">รูป:</label>
<textarea placeholder='เช่น https://firebasestorage.googleapis.com/v0/b/dbstore-pninitz.appspot.com/o/promotionwatchshop-AQUA%20TERRA%20SHADES.jpg?alt=media&token=3670338b-0212-43e2-80e5-2592f7312258,https://firebasestorage.googleapis.com/v0/b/dbstore-pninitz.appspot.com/o/promotionwatchshop-AQUA%20TERRA%20SHADES.jpg?alt=media&token=3670338b-0212-43e2-80e5-2592f7312258' id="Images" rows="4" name="Images" value={editedProduct ? editedProduct.Images : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />



      <div className="text-center pt-1">
      <button class="button-35" role="button" onClick={handleSaveChanges}>เพิ่มสินค้า</button>
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
        
      
      
         
        </>
      ) : (
        <>
        <p className="text-center">Logging in...</p> 
        
        </>
        
        
      )}


    </main>
  );

  }