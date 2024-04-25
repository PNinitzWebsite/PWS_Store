// `app/dashboard/page.js` is the UI for the `/dashboard` URL
"use client"
import { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import Modal from 'react-modal'; // นำเข้า Modal จาก React Modal
import '../Home.css';

import { useRouter } from 'next/navigation'


import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable ,getDownloadURL} from 'firebase/storage';




export default function SellOrders() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState(null);
  const [productData, setProductData] = useState([]);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedProduct, setEditedProduct] = useState([]);

  const [imageURL, setImageURL] = useState([]);
  const [formMessage, setFormMessage] = useState('');

  const [productId, setProductId] = useState('');

  const [inputValue, setInputValue] = useState('');

  const handleCopy = (event) => {
    // คัดลอกข้อความพร้อมเว้นวรรค
    const textToCopy = productData.Products.replace(/\n/g, '\n');
    navigator.clipboard.writeText(textToCopy);
    // แสดงข้อความแจ้งเตือน
    alert('คัดลอกข้อความแล้ว');
  };


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
    for (let i = 0; i < 8; i++) {
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
        "collection": "orders",
        "database": "db_store",
        "dataSource": "dbstore",
        "filter": {
          "userId": id
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
  const fetchData = async () => {
    try {
      const app = new Realm.App({ id: 'data-whqji' });
      const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
      const user = await app.logIn(credentials);
      setAccessToken(user.accessToken);

      const requestData = {
        "collection": "orders",
        "database": "db_store",
        "dataSource": "dbstore",
      };

      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(requestData)
      };

      const response = await fetch('https://ap-southeast-1.aws.data.mongodb-api.com/app/data-whqji/endpoint/data/v1/action/find', config);
      const data = await response.json();
      
      // ตรวจสอบว่ามีสินค้าที่มีสถานะเป็น "รอชำระเงิน" หรือไม่
      const waitingForPaymentProducts = data.documents.filter(product => product.Status === 'รอชำระเงิน');

      if (waitingForPaymentProducts.length > 0) {
        // มีสินค้าที่มีสถานะเป็น "รอชำระเงิน"
        const latestProduct = waitingForPaymentProducts[waitingForPaymentProducts.length - 1];
        setProductData(latestProduct);
        setEditedProduct(latestProduct);
      } else {
        // ไม่มีสินค้าที่มีสถานะเป็น "รอชำระเงิน"
        console.log("No products waiting for payment found.");
        setProductData(null);
        setEditedProduct(null); // ไม่ต้องแสดงสินค้า
      }
      
    } catch (error) {
      console.error('Fetch data failed:', error);
    }
  };

  fetchData();
}, []);


  
  const fetchData = async (editedProduct, productId) => {
    try {
      // เพิ่มเวลาที่เพิ่มสินค้าลงใน MongoDB
      const currentTime = new Date().toISOString();
  
      const app = new Realm.App({ id: 'data-whqji' });
      const credentials = Realm.Credentials.emailPassword('1641010541194@rmutr.ac.th', 'Non13791');
      const user = await app.logIn(credentials);
      setAccessToken(user.accessToken);

      // ตรวจสอบว่า Warranty ใน MongoDB เป็นเวลาเดียวกันกับเวลาปัจจุบันหรือไม่
    const isSameWarranty = editedProduct.Warranty !== currentTime;
    const isMissingWarranty = !editedProduct.Warranty;

   
  
      const requestData = {
        "collection": "orders",
        "database": "db_store",
        "dataSource": "dbstore",
        "filter": {
          "_id": editedProduct._id,
        },
        "update": {
          "$set": {
            "Status": editedProduct.Status,
            ...(isMissingWarranty && editedProduct.Status !== 'รอชำระเงิน' || !isSameWarranty && editedProduct.Status !== 'รอชำระเงิน' ? { "Warranty": currentTime } : {})
          }
          
        }
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
      window.alert(`ตรวจสอบออเดอร์ ${editedProduct._id} นี้สำเร็จแล้ว | สถานะสินค้า : ${editedProduct.Status}`);
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
      // เพิ่มเงื่อนไขเช็คค่าที่ส่งมา
  if (!editedProduct || !editedProduct.Status) {
    alert("กรุณาเลือกการดำเนินการ");
    return;
  }

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

    setInputValue(e.target.value);
  };
  
  

  return (
    <main className="container mx-auto bg-blue-600 ">
      <h1 className='text-2xl font-bold tracking-tight text-white text-center mt-10 pt-6'>ตรวจสอบการชำระเงิน ออเดอร์ลูกค้า PWS | PromotionWatchShop</h1>
      <br /><hr />
      {accessToken ? (
        <>
        <div className="text-center pb-1 pt-5 ">
        <button class="button-35 " role="button" onClick={() => router.push('/')}>สินค้าในคลัง</button>
        <button class="button-35 " role="button" onClick={() => router.push('/add-orders')}>ขายสินค้า</button>
        <button class="button-35 " role="button" onClick={() => router.push('/orders')}>ออเดอร์ทั้งหมด</button>
        </div>
        
      

          <h1 className='text-2xl font-bold tracking-tight text-white text-center mt-5 pb-6'>ตรวจสอบการชำระเงิน</h1>
            
            <div className={`group relative bg-white rounded-lg p-2 border-double border-2`}>
             
              <div className={`aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-black lg:aspect-none lg:h-70`}>
                
                
              </div>
              <div className="mt-4 flex">
                <div className="mx-auto">
               
               
               <form onSubmit={handleSaveChanges}>
               
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">_Id: ล่าสุด = {productData? productData._id :'ไม่มีออเดอร์ใหม่'}</label>
                  <input readOnly required placeholder='ไม่มีออเดอร์ใหม่' type="text" id="_id" name="_id" value={editedProduct ? editedProduct._id : 'ไม่มีออเดอร์ใหม่'} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
                 
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">ยอดชำระสินค้า ล่าสุด _Id: {productData? productData._id:'ไม่มีออเดอร์ใหม่'}</label>
                  <input
        readOnly
        type="text"
        id="ProductsOld"
        name="ProductsOld"
        value={productData ? productData.Products:'ไม่มี'}
        onClick={handleCopy} // เรียกใช้ handleCopy() เมื่อคลิกที่ input field
        className=" bg-blue-600 text-white cursor-pointer mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
      />
                  <label htmlFor="Products" className="block text-md font-medium text-gray-700">สรุปข้อมูล Order:</label>
<textarea readOnly required rows={12} placeholder='ไม่มีออเดอร์ใหม่แล้ว' type="text" id="Products" name="Products" value={editedProduct ? editedProduct.Products : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />






{productData !== null?( 
  <>
  <label htmlFor="Status" className="block text-md font-medium text-gray-700">การดำเนินการ:</label>
  <select required id="Status" name="Status" value={editedProduct ? editedProduct.Status : '' } onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md">
  <option id="Status" name="Status" disabled selected>เลือกก่อน</option>
  <option className='text-black' id="Status" name="Status" value="รอชำระเงิน">รอชำระเงิน</option>
  <option className='text-blue-600' id="Status" name="Status" value="ชำระเงินเสร็จแล้ว">ชำระเงินเสร็จแล้ว</option>
  <option className='text-yellow-600' id="Status" name="Status" value="เก็บปลายทาง">เก็บปลายทาง</option>
  {/* <option id="Status" name="Status" value="ดำเนินการเตรียมสินค้า">ดำเนินการเตรียมสินค้า</option>
  <option id="Status" name="Status" value="ดำเนินการจัดส่งสินค้า">ดำเนินการจัดส่งสินค้า</option> */}
  {/* <option className='text-green-600' id="Status" name="Status" value="จัดส่งสินค้าสำเร็จ">จัดส่งสินค้าสำเร็จ</option>
  <option className='text-red-600' id="Status" name="Status" value="จัดส่งสินค้าไม่สำเร็จ">จัดส่งสินค้าไม่สำเร็จ</option> */}
</select>
<div className="text-center pt-1 ">
      <button class="button-35 " role="Submit">ยืนยัน</button>
      </div>
      <br />
</>

):(
<>
<br />
</>
)}

  

      

               </form>
                  
      


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