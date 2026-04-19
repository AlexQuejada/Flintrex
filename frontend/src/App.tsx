import React from 'react';
import Layout from './components/layout/layout';
import FileUpload from './components/FiledUpload';
import FileMerge from './components/FileMerge';

function App() {
  return (
    <Layout>
      <div className="space-y-6">
        <FileUpload />
        <hr className="my-6" />
        <FileMerge />
      </div>
    </Layout>
  );
}

export default App;
