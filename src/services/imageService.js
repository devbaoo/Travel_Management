const { bucket } = require("../config//firebase");
const { v4: uuidv4 } = require("uuid");

const uploadImage = async (file) => {
  const uniqueFilename = uuidv4() + "-" + file.originalname;
  const blob = bucket.file(uniqueFilename);

  // Tạo luồng ghi tệp
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype, // Định dạng tệp
    },
  });

  // Sử dụng Promise để xử lý bất đồng bộ
  return new Promise((resolve, reject) => {
    // Xử lý lỗi trong quá trình upload
    blobStream.on("error", (err) => {
      console.error("Lỗi trong quá trình upload:", err);
      reject(new Error("Không thể upload ảnh, vui lòng thử lại sau."));
    });

    // Khi upload hoàn tất
    blobStream.on("finish", async () => {
      try {
        // Tạo URL công khai cho ảnh
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Ghi log quá trình thành công
        console.log("Upload thành công, URL:", publicUrl);

        // Đặt quyền công khai cho file nếu cần
        await blob.makePublic();

        resolve(publicUrl);
      } catch (error) {
        console.error("Lỗi khi tạo URL công khai:", error);
        reject(new Error("Không thể tạo URL công khai cho ảnh."));
      }
    });

    // Ghi dữ liệu từ buffer vào stream
    blobStream.end(file.buffer);
  });
};

module.exports = { uploadImage };
