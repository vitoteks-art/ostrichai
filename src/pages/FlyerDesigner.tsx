import { FlyerDesigner as FlyerDesignerComponent } from "@/components/FlyerDesigner";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const FlyerDesigner = () => {
  return (
    <Layout>
      <SEO
        title="AI Flyer Designer | Create Professional Marketing Flyers"
        description="Design eye-catching flyers for your events and promotions with AI. Choose from professional templates and customize them with AI-powered tools."
      />
      <FlyerDesignerComponent />
    </Layout>
  );
};

export default FlyerDesigner;
