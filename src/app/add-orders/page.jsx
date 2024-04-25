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
    alert('คัดลอกข้อความแล้ว ข้อความส่งให้ลูกค้า สำเร็จแล้ว');
  };
  const handleCopy2 = (event) => {
    // คัดลอกข้อความพร้อมเว้นวรรค
    const textToCopy =
`- 1x [สีขาว] Benten10 Omtimat ราคารวม 1000฿
- 2x [สีเขียว] SUTTHIPONG SAMSUNG  ราคารวม 2000฿
- 3x [สีแดง] SUTTHIPONG SAMSUNG ราคารวม 3000฿
- 6x ของแถมถ่านนาฬิกาใว้เปลี่ยนเวลาถ่านหมด ฟรี`;
    navigator.clipboard.writeText(textToCopy);
    // แสดงข้อความแจ้งเตือน
    alert('คัดลอกข้อความแล้ว ตัวอย่างสำเร็จแล้ว');
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
      const D = data.documents.length;
      if (D > 0) {
        // console.log("Latest _id:", data.documents[D - 1]._id);
        setProductData(data.documents[D - 1]);
       
      }else {
        console.log(data.documents);
      setProductData(data.documents);
      
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
  
      const requestData = {
        "collection": "orders",
        "database": "db_store",
        "dataSource": "dbstore",
        "document": {
          "_id": editedProduct._id,
          // "Note": editedProduct.Note,
          "userId": editedProduct.userId,
          "Products":
`----------------------------------------
🌟 โปรดตรวจสอบความเรียบร้อย 🌟
----------------------------------------
🛍️ สินค้าที่สั่งซื้อ:
${editedProduct.Products}
            
🧾 รายละเอียดการชำระเงิน:
- เลขชำระสินค้า: ${editedProduct._id}
- รหัสลูกค้า: ${editedProduct.userId}
- ค่าส่ง: ${parseFloat(editedProduct.Cost)} ฿
- ส่วนลด:  ${parseFloat(editedProduct.Discount)} ฿
- ยอดชำระรวม: ${parseFloat(editedProduct.TotalPrice)} ฿
         
🚚 ที่อยู่จัดส่งสินค้า:
- ชื่อผู้รับ: ${editedProduct.Name}
- ที่อยู่: ${editedProduct.Address}
- เบอร์ติดต่อ: ${editedProduct.Tell}

💳 วิธีการชำระเงิน:
✔️ บัญชีธนาคาร กรุงไทย (KTB)
- เลขบัญชี: 732-065108-4
- ชื่อบัญชี: สุทธิพงษ์ ณะอิ่น

📦 ตรวจสอบเงื่อนไขประกันสินค้า:
#สินค้า [กันน้ำ] รับประกัน 1 เดือน
#สินค้า [ไม่กันน้ำ] รับประกัน 14 วัน


🔍 เงื่อนไขการรับประกันสินค้า:
#ประกันสินค้าจะเริ่มนับเมื่อจัดส่งสินค้าสำเร็จแล้ว
(ไม่รับประกัน หากลูกค้านำไปซ่อมที่ร้านนาฬิกาแล้ว)
- กรุณาอัดคลิปตอนแกะกล่องสินค้า หากเกิดเหตุการณ์ สินค้าชำรุด ขณะขนส่ง จะได้มีการส่งเปลี่ยนสินค้าใหม่ ส่งคลิปหลักฐานในแชทได้เลย (ต้องภายใน 14 วันเท่านั้น)
- รับประกันสินค้าทำงานผิดปกติ เช่น นาฬิกาไม่เดิน/หยุดเดิน หรือ ปุ่มนาฬิกากดไม่ติด หรือใช้งานตามฟังก์ชั่นตามรุ่นนั้นๆ ไม่ได้
- รับประกันนาฬิกาจากทางร้านเท่านั้น อ้างอิงจากการสั่งซื้อสินค้าที่รหัสลูกค้าสั่งซื้อสินค้า 

📌 สอบถามเพิ่มเติม หรือติดตามสถานะสินค้าได้ที่แชท
----------------------------------------`
          ,
          "Cost": parseFloat(editedProduct.Cost),
          "Discount": parseFloat(editedProduct.Discount),
          "TotalPrice": parseFloat(editedProduct.TotalPrice),// แปลงเป็น decimal
          "Name": editedProduct.Name, 
          "Address": editedProduct.Address,
          "Tell": editedProduct.Tell,
          "Status": editedProduct.Status,
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
      window.alert(`ขายสินค้าให้กับลูกค้า ${productId} สำเร็จแล้ว | สถานะสินค้า : ${editedProduct.Status}`);
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
    <main className="container mx-auto bg-green-400">
      <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-10 pt-6'>ขายสินค้า PWS | PromotionWatchShop</h1>
      <br /><hr />
      {accessToken ? (
        <>
        <div className="text-center pb-1 pt-5 ">
        <button class="button-35 " role="button" onClick={() => router.push('/')}>สินค้าในคลัง</button>
        <button class="button-35 " role="button" onClick={() => router.push('/orders-status')}>ตรวจสอบการชำระเงิน</button>
        <button class="button-35 " role="button" onClick={() => router.push('/orders')}>ออเดอร์ทั้งหมด</button>
        </div>
      

          <h1 className='text-2xl font-bold tracking-tight text-gray-900 text-center mt-5 pb-6'>ขายสินค้า</h1>
            
            <div className={`group relative bg-white rounded-lg p-2 border-double border-2`}>
             
              <div className={`aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-black lg:aspect-none lg:h-70`}>
                
                
              </div>
              <div className="mt-4 flex">
                <div className="mx-auto">
                <label htmlFor="_id" className="block text-md font-medium text-gray-700">ยอดชำระสินค้า ล่าสุด _Id: {productData._id}</label>
                  <input
        readOnly
        type="text"
        id="ProductsOld"
        name="ProductsOld"
        value={productData.Products}
        onClick={handleCopy} // เรียกใช้ handleCopy() เมื่อคลิกที่ input field
        className=" bg-blue-600 text-white cursor-pointer mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
      />
                <label htmlFor="userId" className="block text-md font-medium text-gray-700">ID ลูกค้า (กรณียังไม่เคยซื้อ):</label>
                  <input
  type="text"
  id="userId"
  name="userId"
  value={productId}
  onChange={(e) => setProductId(e.target.value)}
  className="mt-1 mb-2 px-3 py-2 block w-full text-white bg-black border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
  readOnly
/>
               
               <form onSubmit={handleSaveChanges}>
               <label htmlFor="userId" className="block text-md font-medium text-gray-700">ID ลูกค้า:</label>
                  <input required
  type="text"
  id="userId"
  name="userId"
  value={editedProduct ? editedProduct.userId : ''}
  onChange={handleChange}
  className="mt-1 mb-2 px-3 py-2 block w-full text-white bg-black border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
/>
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">_Id: ล่าสุด = {productData._id}</label>
                  <input required placeholder='เช่น _id ล่าสุด + 1' type="text" id="_id" name="_id" value={editedProduct ? editedProduct._id : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
                 
                  <label htmlFor="ProductsT" className="block text-md font-medium text-gray-700">ตัวอย่าง สรุปข้อมูล Order</label>
                  <input
        readOnly
        type="text"
        id="ProductsT"
        name="ProductsT"
        value='- 1x [สีขาว] Benten10 Omtimat ราคารวม 1000฿
        - 2x [สีเขียว] SUTTHIPONG SAMSUNG  ราคารวม 2000฿
        - 3x [สีแดง] SUTTHIPONG SAMSUNG ราคารวม 3000฿
        - 6x ของแถมถ่านนาฬิกาใว้เปลี่ยนเวลาถ่านหมด ฟรี'
        onClick={handleCopy2} // เรียกใช้ handleCopy() เมื่อคลิกที่ input field
        className=" bg-blue-600 text-white cursor-pointer mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
      />

                  <label htmlFor="Products" className="block text-md font-medium text-gray-700">สรุปข้อมูล Order:</label>
<textarea required rows={12} placeholder='เช่น - 1x [สีขาว] Benten10 Omtimat ราคารวม 1000฿
- 2x [สีเขียว] SUTTHIPONG SAMSUNG  ราคารวม 2000฿
- 3x [สีแดง] SUTTHIPONG SAMSUNG ราคารวม 3000฿
- 6x ของแถมถ่านนาฬิกาใว้เปลี่ยนเวลาถ่านหมด ฟรี' type="text" id="Products" name="Products" value={editedProduct ? editedProduct.Products : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
 
<label htmlFor="Cost" className="block text-md font-medium text-gray-700">ค่าส่ง:</label>
<input required placeholder='เช่น 60' type="number" id="Cost" name="Cost" value={editedProduct ? editedProduct.Cost : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Discount" className="block text-md font-medium text-gray-700">ส่วนลด:</label>
<input required placeholder='เช่น 10' type="number" id="Discount" name="Discount" value={editedProduct ? editedProduct.Discount : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

<label htmlFor="TotalPrice" className="block text-md font-medium text-gray-700">ยอดชำระรวม:</label>
<input required placeholder='เช่น 5000' type="number" id="TotalPrice" name="TotalPrice" value={editedProduct ? editedProduct.TotalPrice : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Name" className="block text-md font-medium text-gray-700">ชื่อผู้รับ:</label>
<input required placeholder='เช่น สุทธิพงษ์ ณะอิ่น' type="text" id="Name" name="Name" value={editedProduct ? editedProduct.Name : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />



<label htmlFor="Address" className="block text-md font-medium text-gray-700">ที่อยู่:</label>
<textarea required rows='3' placeholder='เช่น 15/207 หมู่บ้านจิตณรค์ 21' type="text" id="Address" name="Address" value={editedProduct ? editedProduct.Address : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Tell" className="block text-md font-medium text-gray-700">เบอร์โทรศัพท์:</label>
<input required placeholder='เช่น 0971593816' type="text" id="Tell" name="Tell" value={editedProduct ? editedProduct.Tell : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Status" className="block text-md font-medium text-gray-700">การดำเนินการ:</label>
<select required id="Status" name="Status" value={editedProduct ? editedProduct.Status : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md">
  <option id="Status" name="Status" disabled selected>เลือกก่อน</option>
  <option className='text-black' id="Status" name="Status" value="รอตรวจสอบ">รอตรวจสอบ</option>
  <option className='text-blue-600' id="Status" name="Status" value="ชำระเงินเสร็จแล้ว">ชำระเงินเสร็จแล้ว</option>
  <option className='text-yellow-600' id="Status" name="Status" value="เก็บปลายทาง">เก็บปลายทาง</option>
  {/* <option id="Status" name="Status" value="ดำเนินการเตรียมสินค้า">ดำเนินการเตรียมสินค้า</option>
  <option id="Status" name="Status" value="ดำเนินการจัดส่งสินค้า">ดำเนินการจัดส่งสินค้า</option> */}
  {/* <option className='text-green-600' id="Status" name="Status" value="จัดส่งสินค้าสำเร็จ">จัดส่งสินค้าสำเร็จ</option>
  <option className='text-red-600' id="Status" name="Status" value="จัดส่งสินค้าไม่สำเร็จ">จัดส่งสินค้าไม่สำเร็จ</option> */}
</select>
  

      <div className="text-center pt-1">
      <button class="button-35" role="Submit">ขายสินค้า</button>
      </div>
      <br />

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