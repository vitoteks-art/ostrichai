import Layout from "@/components/Layout";
import LogoCreator from "@/components/LogoCreator";
import SEO from "@/components/SEO";

const LogoCreation = () => {
  return (
    <Layout>
      <SEO
        title="AI Logo Creation | Professional Brand Identity Designer"
        description="Generate professional logos for your brand with AI. Create unique brand identities instantly with our advanced AI logo designer."
      />
      <LogoCreator />
    </Layout>
  );
};

export default LogoCreation;
