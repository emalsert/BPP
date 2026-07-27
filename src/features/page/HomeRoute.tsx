import { CreatePageForm } from './CreatePageForm';
import { MyPagesList } from './MyPagesList';

export function HomeRoute() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-10">
      <CreatePageForm />
      <MyPagesList />
    </div>
  );
}
