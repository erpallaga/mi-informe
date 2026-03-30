import PageTitle from "@/components/shared/PageTitle";
import GoalSelector from "@/components/ajustes/GoalSelector";
import CategoryManager from "@/components/ajustes/CategoryManager";
import SignOutButton from "@/components/ajustes/SignOutButton";

export default function AjustesPage() {
  return (
    <>
      <PageTitle title="Ajustes" />
      <div className="flex flex-col gap-8">
        <GoalSelector />
        <CategoryManager />
        <SignOutButton />
      </div>
    </>
  );
}
