exports.processPath = async (file) => {
  let file_path_on_db;

      if(file?.path.split("\\").length > 1 && file?.path.split("\\")[0] === "public"){
          
          const  file_path_to_array = file.path.split("\\");
          file_path_to_array.shift();
          
          file_path_on_db = file_path_to_array.join("/");
      }else{
          file_path_on_db = file.path.split("\\").replaceAll("\\","/");
      } 

      return file_path_on_db;
}

exports.removeDiskPath = async (filePath) => {
  // Determine the OS path separator based on the environment
  const pathSeparator = process.platform === 'win32' ? '\\' : '/';

  // Split the file path into segments using the path separator
  const pathSegments = filePath.split(pathSeparator);

  // Remove the disk path segments (usually the first one or two)
  const dynamicPathSegments = pathSegments.slice(1); // Adjust the index if necessary

  // Join the remaining segments to form the dynamic path
  return dynamicPathSegments.join('/');
}