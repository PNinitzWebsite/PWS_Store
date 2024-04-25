"use client"

import { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import Modal from 'react-modal'; // นำเข้า Modal จาก React Modal
import '../Home.css';

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
        "collection": "orders",
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
          "collection": "orders",
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
            "collection": "orders",
            "database": "db_store",
            "dataSource": "dbstore",
            "filter": {
                "_id": editedProduct._id
            },
            "update": {
                "$set": {
                  "Products":editedProduct.Products
                            ,
                            "Cost": parseFloat(editedProduct.Cost),
                            "Discount": parseFloat(editedProduct.Discount),
                            "TotalPrice": parseFloat(editedProduct.TotalPrice),// แปลงเป็น decimal
                            "Name": editedProduct.Name, 
                            "Address": editedProduct.Address,
                            "Tell": editedProduct.Tell,
                            "Status": editedProduct.Status,
            }
            },
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
    <main className="container mx-auto bg-purple-800">
      <h1 className='text-2xl font-bold tracking-tight text-white text-center mt-10 pt-6'>ข้อมูลออเดอร์ทั้งหมด PWS | PromotionWatchShop</h1>
      <br /><hr />
      {accessToken ? (
        <>
        <div className="text-center pb-1 pt-5">
       
        <button class="button-35" role="button" onClick={() => router.push('/')}>สินค้าในคลัง</button>
        <button class="button-35" role="button" onClick={() => router.push('/add-products')}>เพิ่มสินค้า</button>
        <button class="button-35" role="button" onClick={() => router.push('/add-orders')}>ขายสินค้า</button>
        <button class="button-35" role="button" onClick={() => router.push('/orders-status')}>ตรวจสอบการชำระเงิน</button>
        
      
</div>
          <h1 className='text-2xl font-bold tracking-tight text-white text-center mt-5 pb-6'>สินค้าที่มีทั้งหมด</h1>
          <div className='mx-auto text-center text-white'>
          <label htmlFor="searchId">ใส่ _ID เพื่อค้นหาออเดอร์: </label>
      <input type="text" id="searchId" className='text-black mt-1 mb-2 px-3 py-2 rounded-md shadow-xl sm:text-md' value={searchId} onChange={(e) => setSearchId(e.target.value)} />
      <button className='button-35' onClick={handleSearch}>ค้นหา</button>
          </div>
          
          <div className="bg-red-100">
            <div className='mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 '>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8 ">
                {productData?.map(product => (
                  <div key={product._id} className={`group relative bg-white rounded-lg p-2 border-double border-2   ${hoveredProductId === product._id ? 'border-red-600' : 'border-black'}`} onClick={() => handleProductClick(product._id)}>
                    
                    <div className="mt-4 flex text-center">
                      <div className="mx-auto">
                      <p className={`text-lg font-bold ${
  product.Status === 'รอชำระเงิน' ? 'text-gray-600' :
  product.Status === 'ชำระเงินเสร็จแล้ว' ? 'text-blue-600' :
  product.Status === 'เก็บปลายทาง' ? 'text-yellow-600' :
  product.Status === 'จัดส่งสินค้าสำเร็จ' ? 'text-green-600' :
  'text-red-600'
}`}>สถานะ : {product.Status}</p>
                        <h3 className="mt-1 text-lg text-black font-bold">
                          
                          <span aria-hidden="true" className="absolute"></span>
                          รหัสสั่งซื้อ : {product._id}
                        </h3>
                        <h3 className="text-lg text-black font-bold">
                          <span aria-hidden="true" className="absolute"></span>
                          รหัสลูกค้า : {product.userId}
                        </h3>
                    
                       
                        
                        <p className="mb-2 text-md font-medium text-black">ยอดชำระรวม {formatPrice(product.TotalPrice)}</p>
                       
                        {product.Status === 'รอชำระเงิน' ?(
                          <>
                          <p className="mb-2 text-md font-medium text-red-800">เวลาชำระเงิน <br /> {'ยังไม่ตรวจสอบการชำระ'}</p>
                          </>
                        ) : (
                          <>
                           <p className="mb-2 text-md font-medium text-blue-800">เวลาชำระเงิน <br /> {product? product.Warranty:'ยังไม่ตรวจสอบการชำระ'}</p>
                          </>
                        )}
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
             
             
              <div className="mt-4 flex">
                <div className="mx-auto">
                
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
                  <label htmlFor="_id" className="block text-md font-medium text-gray-700">รหัสสั่งซื้อ :</label>
                  <input readOnly required placeholder='เช่น _id ล่าสุด + 1' type="text" id="_id" name="_id" value={editedProduct ? editedProduct._id : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
                 
                 
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
  <option className='text-black' id="Status" name="Status" value="รอชำระเงิน">รอชำระเงิน</option>
  <option className='text-blue-600' id="Status" name="Status" value="ชำระเงินเสร็จแล้ว">ชำระเงินเสร็จแล้ว</option>
  <option className='text-yellow-600' id="Status" name="Status" value="เก็บปลายทาง">เก็บปลายทาง</option>
  {/* <option id="Status" name="Status" value="ดำเนินการเตรียมสินค้า">ดำเนินการเตรียมสินค้า</option>
  <option id="Status" name="Status" value="ดำเนินการจัดส่งสินค้า">ดำเนินการจัดส่งสินค้า</option> */}
  <option className='text-green-600' id="Status" name="Status" value="จัดส่งสินค้าสำเร็จ">จัดส่งสินค้าสำเร็จ</option>
  <option className='text-red-600' id="Status" name="Status" value="จัดส่งสินค้าไม่สำเร็จ">จัดส่งสินค้าไม่สำเร็จ</option>
</select>

<label htmlFor="CreatedAt" className="block text-md font-medium text-gray-700">เวลาสั่งออเดอร์: </label>
<input required readOnly type="text" id="CreatedAt" name="CreatedAt" value={editedProduct ? editedProduct.CreatedAt : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />
<label htmlFor="Warranty" className="block text-md font-medium text-gray-700">เวลาเริ่มรับประกันสินค้า:</label>
<input required readOnly type="text" id="Warranty" name="Warranty" value={editedProduct ? editedProduct.Warranty : ''} onChange={handleChange} className="mt-1 mb-2 px-3 py-2 block w-full border-gray-300 rounded-md shadow-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-md" />

      <div className="text-center pt-1">
      <button class="button-35" role="button" onClick={handleSaveChanges}>บันทึก</button>
      </div>
                  {/* ปุ่มบันทึกการเปลี่ยนแปลง */}
      
      </form>
     
     <br />
      
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
